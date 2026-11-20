# @pocket-forge/duelmon agent guide

Duelmon Combat action resolver, authored action binding set, and a private dataset
extractor for the Pokémon Showdown Gen 1 tables.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test plugins/duelmon --conditions=development` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)
- **Extract dataset:** `bun run extract --source <showdown-checkout>` (at package folder)

The package only keeps package-exclusive scripts (`build`, `prepublishOnly`, `extract`); everything else runs from the repo root.

## Boundary

This package is a private implementation outside the neutral Combat core. It may import `@pocket-forge/combat/domain`, `@pocket-forge/combat-engine/domain`, `@pocket-forge/combat-engine/rules`, and `@pocket-forge/attribute/domain`. Neither `packages/combat` nor `packages/combat-engine` may import it.

## Dataset

The generated Pokémon dataset is not committed. See the [README](./README.md) for the pinned Showdown commit and the local extraction workflow.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
