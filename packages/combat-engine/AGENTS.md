# @pocket-forge/combat-engine agent guide

Pure combat engine and extension framework. The Combat Engine, Combat Setup, the Combat Rule base and its hook contracts, the action resolver and action binding contracts, and the built-in rules.

- **Package manager:** Bun (`bun`)
- **Build:** `bun run build` (at package folder)
- **Test:** `bun test packages/combat-engine --conditions=development` (at root)
- **Type-check:** `bun run typecheck` (at root)
- **Lint:** `bun run lint:fix` (at root)

The package only keeps package-exclusive scripts (`build`, `prepublishOnly`); everything else runs from the repo root.

## Boundary

This package orchestrates neutral combat state from `@pocket-forge/combat`. It must not import `@pocket-forge/duelmon` or another concrete plugin; concrete rules and action resolvers live outside the neutral core. The Combat glossary lives in [packages/combat/CONTEXT.md](../combat/CONTEXT.md).

## Structure

- `./domain` holds the engine and its contracts: `CombatEngine`, `CombatEngineSetup`, `CombatRule`, the hook interfaces, the action resolver and action binding contracts, events, outcomes, and resolution errors. It must stay free of concrete rules.
- `./rules` holds the built-in rule implementations: `rules/composition` (composition base, group constraints, `1v1`, `2v2`) and `rules/completion` (threshold completion rule and its configuration).

## Conventions

This package follows the patterns documented in [Package conventions](../../docs/agents/package-conventions.md). Refer there for:

- Directory structure
- Import conventions
- Domain entity patterns
- Testing patterns (Object Mother, mocks, test structure)
- Dependency management
