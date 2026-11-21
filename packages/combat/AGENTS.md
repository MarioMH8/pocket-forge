# @pocket-forge/combat agent guide

Immutable, neutral combat state: the Combat aggregate, its participant composition, reproducibility state, and active/completed lifecycle. The Combat Engine and extension contracts live in `@pocket-forge/combat-engine`.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run prepublishOnly` (at package folder)
- **Test:** `bun test packages/combat` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`prepublishOnly`); everything else runs from the repo root.

## Boundary

This package holds state only. It must not import `@pocket-forge/combat-engine`, `@pocket-forge/duelmon`, or any action, ruleset, or completion implementation. The glossary lives in [CONTEXT.md](./CONTEXT.md).

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
