# @pocket-forge/duelmon agent guide

Duelmon Combat action plugin and authored action set.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test plugins/duelmon --conditions=development` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`build`, `prepublishOnly`); everything else runs from the repo root.

## Boundary

This package is a private implementation outside the neutral Combat core. It may import `@pocket-forge/combat/domain` and `@pocket-forge/attribute/domain`. `packages/combat` must never import it.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
