# Duelmon

Duelmon combat plugin and its catalog bridge. Terms here are specific to
`@pocket-forge/duelmon`; core Combat vocabulary stays in
`packages/combat/CONTEXT.md`, and dataset vocabulary stays in
`plugins/duelmon-dataset/CONTEXT.md`.

## Language

**Duelmon Combat Plugin**:
The private product name of the Duelmon action resolver. It implements the Combat Action Resolver contract, registers the Modify Attribute Action and the generalized Use Move Action, and has no plugin id or `supports` check; the app wires it with an action binding set.
_Avoid_: Core action resolver, engine plugin, Combat Action Plugin

**Duelmon Catalog**:
The neutral bridge built by `DuelmonCatalog.fromDataset` from the Duelmon Dataset. It exposes Species and Move entities plus `typeMultipliers`, validates the complete Gen 1 type chart and the Gen 1 move-effect vocabulary at the boundary, and is required by the Duelmon Combat Plugin.
_Avoid_: Dataset loader, content registry

**Duelmon Combat Start**:
The start contract that resolves Phase 1 content references into a validated initial Combat. It derives Gen 1 battle attributes, rejects unknown or unsupported content, aggregates every failure, and never returns a partial combat.
_Avoid_: Battle bootstrap, battle factory, initial-state builder

**Phase 1 Move Support**:
The subset of Moves a Phase 1 combat may start with: damaging, full accuracy, zero priority, and without captured primary status, stat-stage, or secondary effects. The catalog maps those declarations into the neutral Move, so the policy never reads the private dataset.
_Avoid_: Supported moves, content allowlist

**Duelmon Type Chart**:
The validated value object behind the catalog's `typeMultipliers`. It owns the complete fifteen-defender, fifteen-attack relation table so actions never handle a lazy chart error.
_Avoid_: Effectiveness helper, type matrix

**Move Effect**:
The captured status, stat-stage, or secondary effect of a Move. Effects are schema-driven data, not executable callbacks; unsupported effects are rejected or reported as ignored.
_Avoid_: Move callback, hardcoded effect

**Move Target**:
The neutral taxonomy that maps a Showdown target selector to single-opponent, all-opponents, self, own-side, random-opponent, all-adjacent, or scripted behavior.
_Avoid_: Showdown target string, raw target

**Use Move Action**:
The Duelmon action that resolves one Move from a combatant against its declared target. Both categories consume PP; damaging Moves resolve accuracy, immunity, damage, and secondary effects, while Status Moves resolve accuracy, stat-stage changes, and primary status conditions.
_Avoid_: Attack action, skill resolution

**Use Move Resolution**:
The value object that resolves the Move, species, combatants, types, multipliers, target, and captured effects for one `useMove` action before randomness is drawn.
_Avoid_: Input parser, preflight

**Gen 1 Damage Slice**:
The implemented subset of the original damage formula: base damage, STAB, one truncation per defender type, and the random factor, with a minimum of one damage for non-immune hits.
_Avoid_: Full battle engine, combat simulator

**Use Move Mechanics**:
The generation-specific seam behind the damaging branch of the Use Move Action. It reads battle stats, owns the damage random factor, and calculates damage; accuracy and status draws live in Gen 1 Accuracy and Gen 1 Status Mechanics.
_Avoid_: Damage utility, formula helper

**Gen 1 Accuracy**:
The generation-specific accuracy check shared by damaging and Status Moves. It owns the accuracy and evasion stage calculation and the accuracy draw.
_Avoid_: Hit helper, accuracy utility

**Gen 1 Status Mechanics**:
The generation-specific seam for primary status conditions and secondary status effects. It owns status immunities, sleep duration, and status chance draws.
_Avoid_: Status utility, status resolver

**Move PP**:
The per-combatant `movePp` battle attribute: one record per known Move with its identifier, current uses, and maximum uses. The catalog's `pp` remains the maximum.
_Avoid_: Mana, energy

**Status Condition**:
A primary battle status: burn, freeze, paralysis, poison, sleep, or toxic. A combatant has at most one, carried by the `status` attribute plus its counters.
_Avoid_: Ailment, debuff

**Stat Stage**:
A battle attribute in the -6..+6 range for attack, defense, special, speed, accuracy, or evasion. Stage changes are emitted as Attribute Modified events.
_Avoid_: Stat modifier, buff

**Duelmon Combat Turn**:
The ordered resolution of the actions declared for one turn: priority and effective Speed determine order, the Combat Engine resolves each action, and the turn returns one Combat Resolution with events renumbered in turn order.
_Avoid_: Game loop, round, battle manager

**Switch Action**:
The Duelmon action that changes the active subset of a Combatant Group. It is not bound to a Move and is resolved from the plugin's discriminated input.
_Avoid_: Swap, replacement

**Unsupported Move**:
A Move whose captured effect or target is outside the implemented slice; the action rejects it with a structured failure instead of approximating it.
_Avoid_: Unimplemented move

**Ignored Move Effect**:
A captured effect that the current slice acknowledges but does not apply, such as a volatile secondary status. The action emits a Move Effect Ignored event.
_Avoid_: Silent no-op

**Modify Attribute Action**:
The Duelmon action that sets, adds, or subtracts one declared attribute on a Combat, Combatant Group, or Combatant, optionally gated by one deterministic probability draw.
_Avoid_: Stat change, damage action

**Attribute Catalog**:
The project-level list of Attribute Definitions injected into the Duelmon Combat Plugin to validate and saturate target attributes.
_Avoid_: Attribute registry, stat table
