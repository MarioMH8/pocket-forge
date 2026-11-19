<h1 align="center">
  @pocket-forge/duelmon
</h1>

<p align="center">
  Private Duelmon Combat plugin and Pokémon Showdown Gen 1 dataset extractor for Pocket Forge.
</p>

This package is private. It lives outside the neutral Combat core and proves
that Move logic and authored bindings compose through public extension
contracts instead of importing implementation details.

- `DuelmonCombatPlugin` resolves the `modifyAttribute` and `useMove` actions.
- Authored Move-to-action bindings are validated by `CombatActionSet.create`
  from `@pocket-forge/combat/domain` against the plugin catalog.
- `DuelmonDatasetBuilder.build` turns the pinned Showdown tables into a
  curated, serializable Gen 1 dataset.
- `DuelmonCatalog.fromDataset` bridges that dataset to neutral `Species` and
  `Move` entities, so the plugin never depends on the dataset shape.

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

- PP tracking or move selection.
- Status conditions, volatile statuses, or stat stages.
- Critical hits and their ratio.
- Secondary effects, drain, recoil, or multi-hit moves.
- Fixed-damage moves and OHKO moves; they are resolved with the normal formula,
  so a 0-power damaging move still deals the formula's minimum damage.
- Accuracy modifiers, turn order, and switching.

## Dataset

The dataset is generated, not authored. **Pokémon data is not committed**; it
must be generated locally from a Pokémon Showdown checkout or extracted
tarball at the pinned commit:

```
c23d2e942c9c0daadb13a7162a385bf78e3c9353
```

Run the extractor from the package folder:

```bash
bun run extract --source /path/to/pokemon-showdown [--commit <sha>]
```

`--source` points at a checkout or extracted tarball that contains `data/` and
`data/mods/gen1/`. `--out` is optional and defaults to
`plugins/duelmon/data/generated/dataset.json`. `--commit` defaults to the
pinned commit; when `--source` is a git checkout, the extractor verifies that
its `HEAD` matches the requested commit. An extracted tarball has no git
metadata, so the requested commit is recorded as-is with a warning.

The default output path is ignored by git. The extractor prints the resulting
counts; a healthy Gen 1 extraction has 151 species, 165 moves, 15 types, and 0
abilities.

The generated file contains:

- `species` — curated species entries filtered to national numbers 1–151.
- `moves` — curated move entries filtered to numbers 1–165, with Gen 1
  overrides merged and the Gen 1 category derived from the base category and
  merged type. Fractions such as `drain` and `recoil` are `[numerator,
  denominator]` pairs; `secondary` is sanitized to serializable fields.
- `typechart` — the 15 Gen 1 types, keyed by capitalized type name (`Bug`,
  `Fire`, …), with only Gen 1 damage relations.
- `abilities` — always empty, because Gen 1 has no abilities.

The extractor normalizes Showdown's modern tables to Gen 1: species types drop
`Fairy` and fall back to `Normal` when nothing remains, so Mr. Mime keeps
`Psychic` while Clefairy, Clefable, Jigglypuff, and Wigglytuff become `Normal`.
A move type of `???` maps to `Normal`, which keeps Bide on a valid Gen 1 type.

The tests build a small original fixture, so they never need a Showdown
checkout or the generated file.

## Data and licensing

The plugin code follows the repository license. Pokémon Showdown's data files
are MIT-licensed, but the Pokémon names, stats, moves, and abilities they
describe are intellectual property of Nintendo, Game Freak, and The Pokémon
Company. This package is private, the dataset is never committed, and the
repository's neutral core and public packages remain free of third-party game
content. Generate the dataset locally and do not redistribute it.
