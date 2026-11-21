# Use Object Mother and in-memory mocks for testing

Domain and application tests use the Object Mother pattern for test data and in-memory mock implementations for ports (repositories, event buses). This keeps tests fast, deterministic, and free of external dependencies.

## Object Mother (`mother/`)

Each domain entity and command/query has a corresponding Mother that produces valid instances with sensible defaults. Tests override only the fields relevant to the scenario. Mothers use `@faker-js/faker` for randomized but reproducible data.

## In-memory mocks (`mock/`)

Repository and event-bus ports have in-memory mock implementations that satisfy the same interface. Mocks store state in `Map` or arrays, support the same `Either` return types, and allow tests to assert on stored state and published events without hitting a real database or message broker.

## Test runner

Tests run with `bun test --conditions=development`, which resolves the `"development"` export condition in each package's `package.json` to load source files directly instead of built artifacts.
