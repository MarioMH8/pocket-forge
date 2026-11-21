# @pocket-forge/duelmon-dataset agent guide

Private Pokémon Showdown Gen 1 dataset extraction and normalization for Duelmon.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test plugins/duelmon-dataset` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)
- **Extract dataset:** `bun run extract` (at package folder)

The package only keeps package-exclusive scripts (`build`, `extract`); everything else runs from the repo root.

## Boundary

This package consumes Pokémon Showdown tables and produces a serializable Gen 1 dataset. It must not depend on the Duelmon plugin or the Combat core. The generated dataset is never committed or distributed. See [README](./README.md) for the pinned Showdown commit and the extraction workflow.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Testing patterns
- Dependency management
