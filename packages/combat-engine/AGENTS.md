# @pocket-forge/combat-engine agent guide

Pure combat engine and extension framework: the Combat Engine, Combat Setup, action plugin and action set contracts, the Combat Ruleset base, the completion rule contract, and the built-in rulesets.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run prepublishOnly` (at package folder)
- **Test:** `bun test packages/combat-engine` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`prepublishOnly`); everything else runs from the repo root.

## Boundary

This package orchestrates neutral combat state from `@pocket-forge/combat`. It must never import `@pocket-forge/duelmon` or another concrete plugin; concrete formats and action plugins live outside the neutral core. The Combat glossary lives in [packages/combat/CONTEXT.md](../combat/CONTEXT.md).

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
