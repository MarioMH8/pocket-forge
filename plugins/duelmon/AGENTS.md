# @pocket-forge/duelmon agent guide

Duelmon Combat action resolver and authored action binding set. The Pokémon
Showdown Gen 1 dataset lives in `@pocket-forge/duelmon-dataset`.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test plugins/duelmon --conditions=development` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`build`, `prepublishOnly`); everything else runs from the repo root.

## Boundary

This package is a private implementation outside the neutral Combat core. It may import `@pocket-forge/combat/domain`, `@pocket-forge/combat-engine/domain`, `@pocket-forge/combat-engine/rules`, and `@pocket-forge/attribute/domain`. Neither `packages/combat` nor `packages/combat-engine` may import it.

## Dataset

The plugin consumes the dataset through `@pocket-forge/duelmon-dataset` and maps it to the neutral catalog. The generated dataset is not committed; see the dataset package README for the pinned commit and extraction workflow.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
