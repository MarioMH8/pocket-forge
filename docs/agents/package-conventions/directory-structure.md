# Directory structure

All packages in this monorepo follow the same layered structure.

```
packages/<name>/
├── src/                  # Production code only
│   ├── domain/           # Entities, value objects, domain events, repository abstractions
│   │   ├── event/        # Domain events (one file per event)
│   │   ├── repository/   # Abstract repository classes
│   │   └── index.ts      # Barrel: re-exports everything public
│   └── application/      # Commands, queries, and their handlers
│       └── index.ts      # Barrel: re-exports everything public
├── tests/                # Test files, mirroring src/ layers
│   ├── domain/
│   │   ├── event/
│   │   └── index.ts      # Barrel (may be empty)
│   └── application/
│       └── index.ts      # Barrel (may be empty)
├── mother/               # Object Mother factories for tests
│   ├── domain/
│   │   └── index.ts      # Barrel: named re-exports
│   └── application/
│       └── index.ts      # Barrel: named re-exports
└── mock/                 # Mock implementations (vi.fn-based) for tests
    └── domain/
        └── index.ts      # Barrel: named re-exports
```

- `src/` contains **only production code** — no tests, no mothers, no mocks.
- `tests/`, `mother/`, and `mock/` are **development-only** and excluded from the published `dist/`.
- Every subdirectory has a barrel `index.ts` so imports work as `@pocket-forge/<package>/<layer>`.
