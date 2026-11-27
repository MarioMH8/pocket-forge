# Combat plugin roadmap decisions

This record preserves the decisions from the third design interview for the
Duelmon combat plugin. It builds on [0001-pocket-forge-discovery](./0001-pocket-forge-discovery.md)
and [0002-package-architecture](./0002-package-architecture.md). It supersedes
the Battle aggregate decision in 0002 and the flat-only attribute constraint in
[ADR-0009](../adr/0009-express-combat-extension-config-through-validated-attributes.md);
the split between Combat state and engine remains, clarified by
[ADR-0014](../adr/0014-split-combat-state-and-engine-packages.md).

## Quick path

1. Read the accepted direction.
2. Read the decision log by area.
3. Treat deferred items as implementation work, not implicit decisions.

## Accepted direction

| Area                 | Decision                                                                                                                                                                                                                                  |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Scope                | Move coverage before a playable turn loop: data foundation, then bootstrap plus coverage, then turn.                                                                                                                                      |
| Combat lifecycle     | `Combat` is the immutable combat state root. There is no separate Battle aggregate; turn orchestration lives in a concrete Duelmon service.                                                                                              |
| Attribute values     | Typed, closed records are first-class attribute values; records may nest and arrays may contain records.                                                                                                                                  |
| Record schema        | `type: 'record'` with `fields: AttributeDefinition[]`; arrays of records use `itemDefinition`.                                                                                                                                             |
| Gen 1 normalization  | The dataset builder collapses Special Attack and Special Defense into one Special stat and normalizes boost keys; `boosts` apply to the target selected by `target`.                                                                       |
| Move resolution      | One generalized `useMove` action resolves damaging and Status Moves.                                                                                                                                                                       |
| Move coverage        | Primary status conditions, stat stages, Status Moves, and secondary status/boosts. Volatile secondaries are ignored with an event; unsupported unique effects are rejected.                                                               |
| Battle state         | Stages are individual numeric attributes; status is an enum plus counters; Move PP is an array of records.                                                                                                                                |
| Generation seams     | `Gen 1 Accuracy` is shared; `Gen 1 Status Mechanics` owns status draws; `Use Move Mechanics` is damage-only.                                                                                                                              |
| Targets              | A complete neutral Move Target enum replaces raw Showdown selectors.                                                                                                                                                                      |
| Events               | `move-used` is discriminated; stages reuse `attribute-modified`; status uses `status-applied`/`status-failed`; ignored effects emit `move-effect-ignored`.                                                                                |
| Turn                 | One Combat Turn service returns one `CombatResolution` with events renumbered in turn order.                                                                                                                                               |
| Active subset        | `activeCombatantIds` is a group attribute; up to two active combatants; switching is a separate action.                                                                                                                                   |
| Terminology          | Combatant Group for the side, Active Combatant for the in-play subset, Party for the persistent Game Session roster; avoid Team in the domain.                                                                                             |
| Completion           | `ThresholdCombatCompletionRule` gains a configurable `mode: 'any' \| 'all'`, default `all`.                                                                                                                                                 |
| Persistence          | `Combat` stays serializable; a `CombatRepository` is deferred.                                                                                                                                                                             |
| Documentation        | Rewrite the affected ADRs, grill decisions, and glossaries; keep the Duelmon Combat Plugin product name and align its contract term to Combat Action Resolver.                                                                             |

## Superseded decisions

- **0002 Q7/Q9/Q10/Q11**: Battle as an independent aggregate root and its
  repository. Combat is the combat state root; there is no Battle aggregate.
- **ADR-0009**: flat-only attribute values. Typed records are now first-class.
- **ADR-0014**: the state/engine split remains; this revision clarifies that
  Combat is the state root and turn orchestration lives outside the engine.

## Decision log

### Scope and sequencing

#### Q1 — Sequence by data foundation, coverage, and turn
**Question:** Should the next cycle optimize for a playable 1v1 or for move
coverage?

**Answer:** Move coverage. Sequence the work as (1) typed attribute records and
Gen 1 move data, (2) Combat bootstrap plus generalized Move resolution and
status/stage coverage, (3) Combat Turn service, active subset, completion, and
residual effects.

**Context:** A playable turn loop would land before the move model is stable.
The data foundation is a prerequisite for capturing Gen 1 effects, and the
bootstrap should be built against the final attribute schema.

### Combat lifecycle

#### Q2 — Combat replaces Battle
**Question:** Does Battle remain an independent aggregate root?

**Answer:** No. Combat is the immutable, serializable combat state root. There
is no separate Battle aggregate. The turn loop lives in a concrete Duelmon
action service, not in the state package or the engine.

**Context:** `docs/grill/0002` originally made Battle an independent, persisted
aggregate. The Combat refactor replaced that role. Keeping both names would
duplicate the lifecycle and fragment persistence. The state/engine split from
ADR-0014 remains.

### Attribute records

#### Q3 — Typed records are first-class
**Question:** How should the plugin represent `boosts`, `secondary`, and `flags`
when the attribute system only stores scalars and arrays?

**Answer:** Extend the attribute system with typed, closed records.
`AttributeValue` becomes recursive: scalars, arrays, records, and arrays of
records. `AttributeDefinition` gains `type: 'record'` with
`fields: readonly AttributeDefinition[]`; arrays of records use
`itemDefinition`. Records apply to all attributes, not only catalog content.

**Context:** Open maps such as `boosts` and `flags` are represented as arrays of
closed records (`[{ stat, stages }]`, `[{ name, value }]`). This keeps
validation and serialization schema-driven and avoids opaque JSON. ADR-0009 is
revised accordingly.

### Gen 1 data normalization

#### Q4 — Normalize Gen 1 data in the builder
**Question:** Where should modern Showdown stat keys and boost recipients be
normalized?

**Answer:** In `DuelmonGen1Normalizer`. Collapse Special Attack and Special
Defense into one `special` key without summing; normalize `atk`/`def`/`spe` to
`attack`/`defense`/`speed`; make `boosts` apply to the recipient selected by
`target`, not always the user.

**Context:** Growth and Amnesia boost `spa` and `spd` in the modern tables, but
Gen 1 has one Special stat. The dataset comment claiming `boosts` apply to the
user is wrong: Growl targets foes. The dataset must speak Gen 1 before the
plugin maps it.

### Move coverage

#### Q5 — Generalize Use Move
**Question:** Should Status Moves use a separate action or the same Use Move
Action?

**Answer:** Generalize the Use Move Action to resolve both damaging and Status
Moves. The action branches by category after shared target and effect
resolution.

**Context:** The app already binds Move identifiers to actions. A single action
keeps the binding surface simple and avoids duplicating target, accuracy, and
PP handling. The move's category decides the mechanics path.

#### Q6 — Cover primary status, stages, and secondary status/boosts
**Question:** What belongs in the first coverage slice?

**Answer:** Primary status conditions (burn, freeze, paralysis, poison, sleep,
toxic), stat stages, Status Moves, and secondary status/boost effects. Volatile
statuses and unique uncaptured effects are outside the slice.

**Context:** The dataset already captures `status`, `boosts`, and `secondary`
for enough moves to make the slice meaningful. Ember, Thunderbolt, Ice Beam,
and Psychic would be silently wrong if secondary status/boosts were skipped.
Volatile secondaries such as flinch and confusion depend on turn-order behavior
that does not exist yet.

#### Q7 — Ignore volatile secondaries with an event
**Question:** What should a damaging Move do when its secondary effect is a
volatile status?

**Answer:** Resolve the damage and emit `move-effect-ignored` for the volatile
effect. Do not reject the Move.

**Context:** Ten damaging Moves have flinch or confusion as a secondary effect.
Rejecting them removes common Moves; storing a volatile status that cannot act
yet is misleading. The event records the deliberate gap until the turn slice
implements volatile behavior.

#### Q8 — Reject unsupported unique effects
**Question:** What should happen to Status Moves whose effects are not captured
by the dataset, such as Recover, Light Screen, Reflect, Substitute, or Transform?

**Answer:** Reject them with a structured `unsupported-move` failure and
document the supported set. Do not approximate them.

**Context:** Fourteen Status Moves have no captured `boosts`, `status`, or
`volatileStatus`. Approximating them would violate the Gen 1 fidelity decision
and hide missing data.

### Battle state

#### Q9 — Stages are individual attributes
**Question:** Should stat stages be one record or individual attributes?

**Answer:** Individual numeric attributes: `attackStage`, `defenseStage`,
`specialStage`, `speedStage`, `accuracyStage`, and `evasionStage`, each in
-6..+6.

**Context:** The existing `modifyAttribute` action, saturation, and event model
already work with flat numeric attributes. A record would force nested updates
and complicate every stage action.

#### Q10 — Status is an enum plus counters
**Question:** How should primary status conditions be represented?

**Answer:** A `status` enum (`none`, `burn`, `freeze`, `paralysis`, `poison`,
`sleep`, `toxic`) plus `sleepTurns` and `toxicCounter` numeric attributes. A
combatant has at most one primary status.

**Context:** Gen 1 allows one primary status at a time. Toxic needs its own value
because its residual damage scales; modeling it as ordinary poison would lose
the mechanic.

#### Q11 — Move PP is an array of records
**Question:** Where does current PP live?

**Answer:** A per-combatant `movePp` attribute: an array of closed records
`{ moveId, current, max }`. The catalog's `pp` remains the maximum; the factory
initializes `current` and `max`.

**Context:** PP is battle state, not catalog data. The record array is explicit,
validated, serializable, and avoids positional coupling with `creature.moves`.

### Action and event contracts

#### Q12 — Shared accuracy, damage-only mechanics
**Question:** Where do accuracy, damage, and status draws live after
generalizing Use Move?

**Answer:** Extract `Gen 1 Accuracy` for the accuracy/evasion check shared by
both categories. Add `Gen 1 Status Mechanics` for status immunities, sleep
duration, and status chance draws. Keep `Use Move Mechanics` damage-only.

**Context:** A single mechanics interface returning damage, status, and boosts
would mix unrelated responsibilities. Three small seams are easier to test and
keep generation-specific behavior behind one boundary.

#### Q13 — Full neutral Move Target enum
**Question:** How should Showdown target selectors be represented?

**Answer:** A complete neutral enum: `self`, `singleOpponent`, `anyOpponent`,
`allOpponents`, `allAdjacent`, `ownSide`, `randomOpponent`, and `scripted`. The
catalog validates every dataset target; the action rejects unimplemented
behavior with `unsupported-move`.

**Context:** The dataset has eight raw target values. Validating the full
vocabulary at the catalog boundary prevents a new selector from leaking into
actions; the implementation can support a subset without changing the schema.

#### Q14 — Discriminated move-used and dedicated status events
**Question:** What events should a generalized Use Move emit?

**Answer:** `move-used` becomes discriminated by `kind: 'damage' | 'status'`
with category-specific payloads and remaining PP. Stage changes reuse
`attribute-modified`; status changes emit `status-applied` or `status-failed`;
ignored effects emit `move-effect-ignored`.

**Context:** One action should have one move event. Reusing
`attribute-modified` keeps stage changes consistent with the existing Modify
Attribute Action. Dedicated status events make application and failure visible
without overloading the move event.

### Turn, active, completion, persistence

#### Q15 — One Combat Resolution per turn
**Question:** What should the turn service return?

**Answer:** A single `CombatResolution` containing the successor Combat, the
merged events renumbered in turn order, and the outcome. The service orders
declared actions by priority and effective Speed, uses the RandomPocket for
ties, resolves each action through the Combat Engine, and stops when combat
completes.

**Context:** A turn is the unit a client persists and replays. Returning one
resolution keeps event ordering inside the service instead of leaking it to
callers.

#### Q16 — Active combatants are a group attribute
**Question:** How is the active subset represented?

**Answer:** An `activeCombatantIds: string[]` attribute on the Combatant Group,
limited to two and validated by the Duelmon composition rule. A separate Switch
Action changes it; it is not a Move binding.

**Context:** The group holds the full party; the active subset is battle state.
A group attribute keeps the core neutral and serializable. The active subset is
deferred until the turn slice.

#### Q17 — Completion mode any/all
**Question:** How should the completion rule handle multi-combatant groups?

**Answer:** Add a `mode: 'any' | 'all'` configuration to
`ThresholdCombatCompletionRule`, default `all`. `any` preserves the previous
per-combatant behavior; `all` requires every combatant in the group to satisfy
the threshold.

**Context:** The current rule uses `some`. With a party, one KO would end the
combat. `all` with `hp <= 0` means a group loses only when every combatant has
fainted. In 1v1 the modes are equivalent.

#### Q18 — CombatRepository deferred
**Question:** Who persists an active Combat now that Battle is gone?

**Answer:** Keep `Combat` serializable through primitives. Defer a
`CombatRepository` port and adapters to a later application cycle.

**Context:** No application use case currently persists an active combat. Adding
a repository without a consumer would put infrastructure concerns in the state
package. The intended future shape is a `CombatRepository`, not a Battle
aggregate.

### Documentation

#### Q19 — Rewrite the affected documentation
**Question:** Which documents should record these decisions?

**Answer:** Rewrite ADR-0009 for typed records and ADR-0014 for the Combat
state-root clarification; update the relevant answers in grill 0002; update the
Combat, Attribute, Game Session, Duelmon, and Duelmon Dataset glossaries; keep
the Duelmon Combat Plugin product name and define it as an implementation of
the Combat Action Resolver contract. Add a short history note to each rewritten
decision.

**Context:** The decisions reverse earlier documented constraints. Leaving the
old text in place would make the next reader re-introduce Battle or flat-only
attributes. The history note preserves the fact that the earlier decision
existed.

### Terminology

#### Q20 — Use Combatant Group, Active Combatant, and Party
**Question:** How do we name the side, the in-play subset, and the persistent
roster?

**Answer:** `Combatant Group` for the side, `Active Combatant` for the in-play
subset (up to two), and `Party` only for the persistent Game Session roster.
Avoid `Team` in the domain.

**Context:** The core glossary already avoids "Team, side"; the product grill
uses Party for GameSession. Keeping Party out of Combat prevents conflating
persistent ownership with combat composition.

## Deferred implementation work

- Verify exact Gen 1 status immunities, sleep duration, freeze thawing,
  paralysis, toxic, and residual damage against the pinned Showdown mod.
- Verify Gen 1 stat-stage multipliers, truncation order with burn and paralysis,
  and the accuracy/evasion formula.
- Define exact event payloads and new `CombatResolutionErrorReason` values.
- Define the Switch Action input as a discriminated union with the Move input
  and the forced-switch flow.
- Add the Duelmon team composition rule for a full party with up to two active
  combatants.
- Add end-of-turn residual effects and sleep/freeze counters.
- Add the future `CombatRepository`; do not add a Battle aggregate.
- Add a changeset for the breaking attribute and combat contract changes.
- Fix the code comments that still say "Combat Action Plugin"
  (`combat-resolution.error.ts`) and the dataset comment that says `boosts`
  apply to the user.
- Add a deterministic weighted AI in a later cycle; it is outside this roadmap.

## Review checklist

- [x] The next cycle is sequenced foundation, coverage, turn.
- [x] Combat replaces Battle as the combat state root.
- [x] Typed records are first-class attribute values.
- [x] Gen 1 data is normalized in the dataset builder.
- [x] Use Move resolves both damaging and Status Moves.
- [x] Volatile secondaries are ignored with an event; unsupported unique
      effects are rejected.
- [x] Stages, status, and PP have explicit battle-state representations.
- [x] The turn service returns one Combat Resolution with renumbered events.
- [x] Active combatants and completion modes are defined.
- [x] Combatant Group, Active Combatant, and Party are the canonical terms.
- [x] Persistence is deferred with a CombatRepository as the intended future
      shape.
- [x] The affected ADRs and grill decisions are rewritten with a history note;
      the glossaries are updated.
