# Context Map

This repo uses a multi-context domain layout. Each context has its own `CONTEXT.md` defining the vocabulary for that bounded context.

## Contexts

- **Ability** — `packages/ability/CONTEXT.md`. Covers Ability terminology.
- **Attribute** — `packages/attribute/CONTEXT.md`. Covers Attribute terminology.
- **Creature** — `packages/creature/CONTEXT.md`. Covers Creature terminology.
- **Combat** — `packages/combat/CONTEXT.md`. Covers Combat terminology across `@pocket-forge/combat` (state) and `@pocket-forge/combat-engine` (engine and extension contracts).
- **Duelmon** — `plugins/duelmon/CONTEXT.md`. Covers the private Duelmon action plugin and its catalog bridge.
- **Duelmon Dataset** — `plugins/duelmon-dataset/CONTEXT.md`. Covers the private Pokémon Showdown Gen 1 dataset extraction and normalization.
- **Game Session** — `packages/game-session/CONTEXT.md`. Covers Game Session terminology.
- **Move** — `packages/move/CONTEXT.md`. Covers Move terminology.
- **RNG** — `packages/rng/CONTEXT.md`. Covers RNG terminology.
- **Species** — `packages/species/CONTEXT.md`. Covers Species terminology.
