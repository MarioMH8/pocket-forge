<h1 align="center">
  @pocket-forge/duelmon
</h1>

<p align="center">
  Private Duelmon Combat action resolver for Pocket Forge.
</p>

This package is private. It lives outside the neutral Combat core and proves
that Move logic and authored bindings compose through public extension
contracts instead of importing implementation details.

- `DuelmonCombatPlugin` resolves the `modifyAttribute` and `useMove` actions.
- Authored action bindings are validated by `CombatActionBindingSet.create`
  from `@pocket-forge/combat-engine/domain` against the resolver catalog.
- `DuelmonCatalog.fromDataset` bridges the dataset from
  `@pocket-forge/duelmon-dataset` to neutral `Species` and `Move` entities, so
  the plugin never depends on the dataset shape.

## Catalog bridge

`DuelmonCatalog.fromDataset(dataset)` builds the neutral catalog once at
startup and returns `Either<DuelmonCatalogError[], DuelmonCatalog>` instead of
producing a partially valid catalog. It validates the complete 15×15 type
chart, every species and move type, and duplicated identifiers before
constructing any entity. The real extracted dataset builds through this
boundary.

The catalog exposes:

- `findSpecies` / `findMove` by dataset identifier.
- `typeMultipliers(moveType, defenderTypes)`, the per-defender-type multiplier
  list the Gen 1 damage formula needs. It is the single type API; the
  `useMove` event derives its effectiveness from the product of this list.

`DuelmonCombatPlugin(attributeDefinitions, catalog, mechanics)` requires the
project attribute catalog, the Duelmon catalog, and the generation mechanics
from the composition edge. `modifyAttribute` validates and saturates against
the attribute definitions; `useMove` reads moves and species from the Duelmon
catalog. Actions and their descriptors live in the same classes, so the plugin
catalog and resolver map are built from one action list.

## Reading the initial state

`DuelmonCombat`, `DuelmonCombatantGroup`, and `DuelmonCombatant` are read-only
semantic views over the `Combat` snapshot returned by `DuelmonCombatStart`.
`DuelmonCombatReport` renders that same snapshot as readable text for the
minimal Phase 1 screen:

```ts
const combat = DuelmonCombatStart.fromContent(request, catalog, definitions).getRight();
const report = DuelmonCombatReport.fromCombat(combat);

console.log(report.toString());
```

The report shows each group's active combatant, current and maximum HP, species
types, and loadout moves. It does not render PP, accuracy, priority, status
conditions, stat stages, or other information outside Phase 1. Views keep no
manual copy of the state: the `Combat` snapshot remains the source of truth.

## Declaring a turn action

A turn declaration is the same parsed shape as the plugin input: one actor,
one Move, and one target. `DuelmonCombatInput.parse` validates the runtime
shape and returns `Either<CombatResolutionError[], DuelmonCombatInput>`:

```ts
const declaration = DuelmonCombatInput.parse({
  actorId: 'player-emberling',
  moveId: 'ember-burst',
  target: { id: 'opponent-aquafin', scope: 'combatant' },
}).getRight();
```

Phase 1 declarations target a combatant; the shared input also carries the
target scopes used by the other registered actions. A declaration without a
`moveId` is rejected instead of selecting a default Move, and one declaration
carries exactly one Move. The declaration is input, not state: parsing it does
not change the `Combat`, and `Combat` has no pending or confirmed action state.
Actor activity, Move ownership, and target validity are not checked by the
parser; they belong to declaration validation against the combat before the
turn resolves. `DuelmonTurnDeclaration.validate` owns those rules and the
plugin applies them to `useMove` declarations before dispatch. Phase 1 move
declarations bind every content Move to `useMove`; generic actions such as
`modifyAttribute` stay outside the turn-declaration contract.

## Recording the start

`DuelmonCombatHistory` records the combat in the basic history as ordered,
serializable entries. The start entry keeps the canonical `Combat` snapshot and
the readable report text, both built from the same `Combat` the resolution
uses:

```ts
const combat = DuelmonCombatStart.fromContent(request, catalog, definitions).getRight();
const history = DuelmonCombatHistory.start(combat);
const entry = history.entries()[0];

console.log(entry?.text);
```

Each entry exposes `kind` (`start` in Phase 1), the serialized `combat`
primitives, and the readable `text`. The history hydrates back through
`DuelmonCombatHistory.fromPrimitives`, keeps its entries in record order, and
never keeps a manual copy of the battle state.

## Use Move action

`useMove` resolves a single-target damaging move for one combatant against
another:

1. Resolve the target, combatants, move, species, types, and multipliers.
2. Stop early on immunity, before any accuracy draw, with a `move-used` event
   carrying `damage: 0` and `effectiveness: 0`.
3. Delegate stats, accuracy, the Gen 1 random factor, and damage to the
   injected `UseMoveMechanics`.
4. Apply the hit or miss result and update the target HP through the injected
   numeric `hp` attribute definition.

Status moves are rejected by category. Physical and Special moves are accepted
even when their power is 0.

## Generation seam

`UseMoveAction` owns orchestration: target resolution, immunity ordering,
events, and the target HP update. `UseMoveResolution` owns move, species,
combatant, type, multiplier, and power/accuracy resolution.
`UseMoveMechanics.resolve` is the generation seam; `Gen1UseMoveMechanics`
reads `Gen1BattleStats`, owns the accuracy check and the 217–255 roll, and
delegates the formula to `Gen1Damage`. A future generation adds a mechanics
implementation without touching the action, and the generic seam never
assumes a single Special stat.

## Gen 1 damage slice

`Gen1Damage.calculate` follows the original integer truncation order:

```
base = floor(floor(floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2
```

- Immunity (any type multiplier equal to 0) returns 0 damage.
- STAB applies `floor(base * 1.5)` for a matching attacker type.
- Each defender-type multiplier applies with a `floor` after it, in order.
- The random factor applies `floor(damage * randomFactor / 255)`, with
  `randomFactor` drawn from 217–255.
- A non-immune hit deals at least 1 damage.

The per-type truncation matters: Ice against Water/Flying starts from a base of
37 and resolves to 36, not 37.

## Current limitations

This slice covers a single damaging hit per action. It does not implement:

- PP tracking or the combat turn service that consumes declarations.
- Status conditions, volatile statuses, or stat stages.
- Critical hits and their ratio.
- Secondary effects, drain, recoil, or multi-hit moves.
- Fixed-damage moves and OHKO moves; they are resolved with the normal formula,
  so a 0-power damaging move still deals the formula's minimum damage.
- Accuracy modifiers, turn order, and switching.

## Dataset

The dataset is generated by `@pocket-forge/duelmon-dataset`. It is not committed
or distributed. See that package's README for the pinned Showdown commit, the
extraction workflow, the dataset shape, and the licensing notes.

The plugin only consumes the generated dataset through `DuelmonCatalog.fromDataset`.

## Roadmap

The next slices — typed record attributes, Gen 1 status and stat-stage coverage, and the combat turn service — are recorded in [docs/grill/0003-combat-plugin-roadmap.md](../../docs/grill/0003-combat-plugin-roadmap.md).
