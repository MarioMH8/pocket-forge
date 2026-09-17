# @pocket-forge/move agent guide

Immutable catalog entries describing creature moves.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run prepublishOnly` (at package folder)
- **Test:** `bun test packages/moves` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`prepublishOnly`); everything else runs from the repo root.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
