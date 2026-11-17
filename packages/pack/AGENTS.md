# @pocket-forge/pack agent guide

Neutral composition context: validates Pack manifests and resolves selected Packs into a Game Definition, without knowing any gameplay subsystem or dependency-injection container.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run prepublishOnly` (at package folder)
- **Test:** `bun test packages/pack` (at root)
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
