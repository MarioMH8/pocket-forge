# Package conventions

All packages in this monorepo follow the same layered structure and patterns. This document is the index — individual package `AGENTS.md` files link back here.

## Sections

- [Directory structure](package-conventions/directory-structure.md) — `src/`, `tests/`, `mother/`, `mock/` layout and barrel files.
- [Imports](package-conventions/imports.md) — absolute `@pocket-forge/*` imports and decorator/handler naming conventions.
- [Domain entities](package-conventions/domain-entities.md) — private constructor, static factory methods, domain events.
- [Repositories](package-conventions/repositories.md) — abstract classes, `Either` return types.
- [Application layer](package-conventions/application-layer.md) — commands, queries, handlers, and the event bus.
- [Testing](package-conventions/testing.md) — Object Mother pattern, mock implementations, test structure, `--conditions=development`.
- [Dependencies](package-conventions/dependencies.md) — peerDependencies, pinned versions, tsconfig paths, package.json exports.
