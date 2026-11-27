# Duelmon Dataset

Private extraction and normalization context for the Pokémon Showdown Gen 1 data used by Duelmon. Core Combat vocabulary stays in `packages/combat/CONTEXT.md`; the plugin vocabulary stays in `plugins/duelmon/CONTEXT.md`.

## Language

**Duelmon Dataset**:
The curated, serializable Gen 1 snapshot produced from a pinned Pokémon Showdown checkout. It carries species, moves with their captured effects, type chart, source commit, and an empty ability list. It is never committed or distributed.
_Avoid_: Content pack, Showdown dump

**Showdown Tables**:
The raw Pokémon Showdown data tables read by the extractor. They include the base tables and the Gen 1 overrides.

**Gen 1 Normalizer**:
The builder policy that converts modern Showdown data into Gen 1 vocabulary. It drops Fairy, maps `???` to a valid type, assigns physical or special categories, collapses Special Attack and Special Defense into one Special stat, and normalizes the stat keys used by boosts.
_Avoid_: Data cleaner, mapper

**Move Boost**:
A stat-stage change captured from a Showdown move. The move's target determines whether it applies to the user or the foe; the normalizer collapses Special Attack and Special Defense keys into one Special key.
_Avoid_: Buff, stat change

**Showdown Move Target**:
The raw Showdown target selector stored in the dataset. The Duelmon catalog maps it to a neutral Move Target; the dataset does not interpret it.
_Avoid_: Target scope, targeting rule

**Duelmon Type**:
One of the fifteen Gen 1 elemental types. The dataset, catalog, and plugin share this vocabulary.
