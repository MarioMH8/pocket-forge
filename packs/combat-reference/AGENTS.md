# @pocket-forge/combat-reference agent guide

Reference Combat rulesets, action plugin, and authored action set.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test packs/combat-reference --conditions=development` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`build`, `prepublishOnly`); everything else runs from the repo root.

## Boundary

This package is a reference implementation outside the neutral Combat core. It may import `@pocket-forge/combat/domain`, `@pocket-forge/combat/infrastructure`, `@pocket-forge/attribute/domain`, `@pocket-forge/pack/domain`, and `@hexadrop/types/primitives`. `packages/combat` must never import it.

The `./pack` entrypoint exports neutral bindings only. It never imports a dependency-injection container or another subsystem.

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
