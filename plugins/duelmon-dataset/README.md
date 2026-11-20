<h1 align="center">
  @pocket-forge/duelmon-dataset
</h1>

<p align="center">
  Private Pokémon Showdown Gen 1 dataset extraction and normalization for Duelmon.
</p>

This package turns a pinned Pokémon Showdown checkout into a curated, serializable Gen 1 dataset. It is private, and the generated dataset is never committed or distributed.

## Usage

```bash
bun run extract --source /path/to/pokemon-showdown [--out path] [--commit sha]
```

`--source` must point to a checkout or extracted tarball containing `data/` and `data/mods/gen1/`. The extractor reads the Showdown TypeScript tables directly; it does not fetch them.

The default output is `data/generated/dataset.json`, which is ignored by git. The default commit is:

```text
c23d2e942c9c0daadb13a7162a385bf78e3c9353
```

## Dataset shape

`DuelmonDatasetBuilder.build` returns a pure, serializable object:

- `generation` — always `1`.
- `source` — repository and pinned commit.
- `species` — 151 curated species with base stats and Gen 1 types.
- `moves` — curated moves with accuracy, category, type, power, and secondary effects.
- `typechart` — the complete Gen 1 defensive type chart.
- `abilities` — always empty, because Gen 1 has no abilities.

The builder merges base Showdown tables with their Gen 1 overrides and normalizes modern data to Gen 1 vocabulary. It is deterministic: the same tables and commit produce the same dataset.

## Catalog bridge

The Duelmon plugin consumes the dataset through `DuelmonCatalog.fromDataset` from `@pocket-forge/duelmon/catalog`. The catalog validates the dataset once and maps it to neutral `Species` and `Move` entities plus a validated type chart. The plugin never imports the raw dataset shape.

## Data and licensing

Pokémon Showdown's data files are MIT-licensed. The Pokémon names, moves, and related data are intellectual property of Nintendo, Game Freak, and The Pokémon Company. This package is private, the dataset is generated locally, and neither the dataset nor the extracted content is redistributed.
