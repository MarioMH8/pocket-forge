# Duelmon

Duelmon combat plugin and its private Gen 1 dataset. Terms here are specific to
`@pocket-forge/duelmon`; core Combat vocabulary stays in
`packages/combat/CONTEXT.md`.

## Language

**Duelmon Combat Plugin**:
A concrete Combat Action Plugin owned by this package that registers the Modify Attribute Action and the Use Move Action and resolves them into a Combat Transition. It has no plugin id or `supports` check; the app wires it with an action set.
_Avoid_: Core action resolver, engine plugin

**Duelmon Catalog**:
The neutral bridge built by `DuelmonCatalog.fromDataset` from the Duelmon Dataset. It exposes Species and Move entities plus `typeMultipliers`, validates the complete Gen 1 type chart at the boundary, and is required by the Duelmon Combat Plugin.
_Avoid_: Dataset loader, content registry

**Duelmon Type Chart**:
The validated value object behind the catalog's `typeMultipliers`. It owns the complete fifteen-defender, fifteen-attack relation table so actions never handle a lazy chart error.
_Avoid_: Effectiveness helper, type matrix

**Use Move Action**:
The Duelmon action that resolves one damaging move from a combatant against a single combatant target: it checks immunity before the mechanics, delegates accuracy and damage to `UseMoveMechanics`, and reduces the target HP.
_Avoid_: Attack action, skill resolution

**Use Move Resolution**:
The value object that resolves the move, species, combatants, types, multipliers, and power/accuracy for one `useMove` action before any randomness is drawn.
_Avoid_: Input parser, preflight

**Gen 1 Damage Slice**:
The implemented subset of the original damage formula: base damage, STAB, one truncation per defender type, and the random factor, with a minimum of one damage for non-immune hits.
_Avoid_: Full battle engine, combat simulator

**Use Move Mechanics**:
The generation-specific seam behind the Use Move Action. It reads battle stats, checks accuracy, owns the damage random factor, and calculates damage, so a new generation only contributes a new mechanics implementation.
_Avoid_: Damage utility, formula helper

**Gen 1 Normalizer**:
The builder policy that drops `Fairy`, falls back to `Normal`, maps `???` to `Normal`, and derives the Gen 1 damage category from the type.
_Avoid_: Type sanitizer, dataset cleanup

**Duelmon Dataset**:
The curated Gen 1 species, moves, typechart, and abilities generated locally from a pinned Pokémon Showdown checkout. It is never committed or distributed.
_Avoid_: Content pack, Showdown dump

**Modify Attribute Action**:
The Duelmon action that sets, adds, or subtracts one declared attribute on a Combat, Combatant Group, or Combatant, optionally gated by one deterministic probability draw.
_Avoid_: Stat change, damage action

**Attribute Catalog**:
The project-level list of Attribute Definitions injected into the Duelmon Combat Plugin to validate and saturate target attributes.
_Avoid_: Attribute registry, stat table
