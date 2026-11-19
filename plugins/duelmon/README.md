<h1 align="center">
  @pocket-forge/duelmon
</h1>

<p align="center">
  Private Duelmon Combat plugin and Pokémon Showdown Gen 1 dataset extractor for Pocket Forge.
</p>

This package is private. It lives outside the neutral Combat core and proves
that Move logic and authored bindings compose through public extension
contracts instead of importing implementation details.

- `DuelmonCombatPlugin` resolves the `modifyAttribute` action.
- Authored Move-to-action bindings are validated by `CombatActionSet.create`
  from `@pocket-forge/combat/domain` against the plugin catalog.
- `buildDuelmonDataset` turns the pinned Showdown tables into a curated,
  serializable Gen 1 dataset.

## Dataset

The dataset is generated, not authored. **Pokémon data is not committed**; it
must be generated locally from a Pokémon Showdown checkout or extracted
tarball at the pinned commit:

```
c23d2e942c9c0daadb13a7162a385bf78e3c9353
```

Run the extractor from the package folder:

```bash
bun run extract --source /path/to/pokemon-showdown
```

`--source` points at a checkout or extracted tarball that contains `data/` and
`data/mods/gen1/`. `--out` is optional and defaults to
`plugins/duelmon/data/generated/dataset.json`.

The default output path is ignored by git. The extractor prints the resulting
counts; a healthy Gen 1 extraction has 151 species, 165 moves, 15 types, and 0
abilities.

The generated file contains:

- `species` — curated species entries filtered to national numbers 1–151.
- `moves` — curated move entries filtered to numbers 1–165, with Gen 1
  overrides merged and the Gen 1 category derived from the base category and
  merged type.
- `typechart` — the 15 Gen 1 types with only Gen 1 damage relations.
- `abilities` — always empty, because Gen 1 has no abilities.

The tests build a small original fixture, so they never need a Showdown
checkout or the generated file.
