# Duelmon Dataset

Private extraction and normalization context for the Pokémon Showdown Gen 1 data used by Duelmon. Core Combat vocabulary stays in `packages/combat/CONTEXT.md`; the plugin vocabulary stays in `plugins/duelmon/CONTEXT.md`.

## Language

**Duelmon Dataset**:
The curated, serializable Gen 1 snapshot produced from a pinned Pokémon Showdown checkout. It carries species, moves, type chart, source commit, and an empty ability list. It is never committed or distributed.
_Avoid_: Content pack, Showdown dump

**Showdown Tables**:
The raw Pokémon Showdown data tables read by the extractor. They include the base tables and the Gen 1 overrides.

**Gen 1 Normalizer**:
The builder policy that converts modern Showdown data into Gen 1 vocabulary. It drops Fairy, maps `???` to a valid type, and assigns physical or special categories.
_Avoid_: Data cleaner, mapper

**Duelmon Type**:
One of the fifteen Gen 1 elemental types. The dataset, catalog, and plugin share this vocabulary.
