# Package architecture decisions

This record preserves the hexadrop-based package architecture decisions from the second design interview. It builds on the product direction settled in [0001-pocket-forge-discovery](./0001-pocket-forge-discovery.md).

## Quick path

1. Start with the accepted decisions table to understand the architecture.
2. Use the numbered decision log when rationale or a correction matters.
3. Individual package names and responsibilities remain intentionally deferred.

## Accepted direction

| Area                 | Decision                                                                                                                                                                                                                         |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Foundation           | `@hexadrop/command`, `@hexadrop/query`, `@hexadrop/aggregate-root`, `@hexadrop/event`, `@hexadrop/either`, `@hexadrop/ioc`, `@hexadrop/value-object`                                                                             |
| CQRS                 | Commands return `Either<E, void>`; Queries return data. Both defined in `application/`.                                                                                                                                          |
| Aggregate Roots      | `GameSession` (contains Player, Party, Roster, Inventory) and `Battle` (autonomous, ephemeral). Only these two in v1.                                                                                                            |
| Entity model         | Entities extend `@hexadrop/aggregate-root`, accumulate domain events internally, exposed via `pullEvents()`.                                                                                                                     |
| Event bus            | `@hexadrop/event` EventBus, registered as a service in the IoC container. No Pocket Forge wrapper needed.                                                                                                                        |
| IoC container        | `@hexadrop/ioc` container. Each domain package exports `./container` with `register(container, options)`.                                                                                                                        |
| DI React hooks       | Pocket Forge package provides `useCommand(CommandClass)` and `useQuery(QueryClass)`.                                                                                                                                             |
| Cache / invalidation | Pocket Forge package provides `useReactQuery(QueryClass)` and `useReactCommand(CommandClass)`. Keys defined on the use case class; cache invalidated after command execution. Optimistic updates via optional method on Command. |
| Layer dependency     | domain → nothing. application → domain. infrastructure → domain + application. presentation → application + domain. presentation never imports infrastructure.                                                                   |
| Entrypoints          | `./domain`, `./application`, `./infrastructure`, `./presentation`, `./presentation/game`, `./presentation/editor`, `./container`, `./manifest.json`. Each with explicit `index.ts` barrel.                                       |
| Exports map          | `types` and `development` conditions per entrypoint. Explicit re-exports only.                                                                                                                                                   |
| Manifest             | Open schema included only in packages that need it. Contains `editor` (panels, tools, eventNodes, schemaContributions), `game` (uiComponents, assetPaths), `locales`, `migrations`.                                              |
| Schemas              | Co-located in domain packages; `manifest.json` declares `schemaContributions`.                                                                                                                                                   |
| Repositories         | IndexedDB, filesystem (Tauri/Capacitor), in-memory for tests. Only ARs have repositories.                                                                                                                                        |
| Persistence          | GameSession and Battle saved as independent snapshots. GameSession composed at load time from its repository.                                                                                                                    |
| Encounter → Battle   | The Encounter use case orchestrates the transition: pause exploration, create Battle, apply results when Battle ends.                                                                                                            |
| Tests                | Colocated with source. Cross-layer integration tests at `tests/` per package.                                                                                                                                                    |

## Decision log

### Foundation and CQRS

#### Q1 — Hexadrop as foundation
**Question:** Should Pocket Forge build on `@hexadrop/*` for Command, Query, AggregateRoot, Event, Either, IoC, and ValueObject?

**Answer:** Yes, all of them.

**Context:** Hexadrop provides the exact abstractions Pocket Forge needs: typed Command/Query base classes, AggregateRoot with internal event recording and `pullEvents()`, typed EventBus (sync, async, pub-sub), Either monad, IoC container, and ValueObject base. No Pocket Forge wrappers are needed.

#### Q2 — CQRS model
**Question:** Should the application layer use CQRS with separate Command and Query classes?

**Answer:** Yes. Commands mutate, persist if needed, emit domain events, and return `Either<E, void>`. Queries return data. Both are defined in `application/` as input ports. The DI package exposes `useCommand()` and `useQuery()` React hooks.

#### Q3 — Event bus
**Question:** Does Pocket Forge need its own event bus or reuse `@hexadrop/event`?

**Answer:** Reuse `@hexadrop/event` as-is.

**Context:** The hexadrop EventBus provides typed pub/sub with sync/async variants, decorators, and in-memory/IoC handler registration. It is registered as a service in the IoC container.

#### Q4 — React Query integration
**Question:** Should the cache/invalidation layer be a Pocket Forge package?

**Answer:** Yes, a dedicated Pocket Forge package.

**Context:** It provides `useReactQuery(QueryClass)` and `useReactCommand(CommandClass)`. Each use case class optionally defines a cache key (including parameters). After a command executes successfully, related queries are invalidated. Commands may also expose an optional method for optimistic state updates.

#### Q5 — Command execution flow
**Question:** How does `useReactCommand` work internally?

**Answer:** It executes the command via the hexadrop command bus, the command handler emits domain events to the EventBus, and React Query invalidates affected queries based on keys.

**Context:** `useReactCommand` does not subscribe to the EventBus itself; it relies on the command handler to emit events and React Query's invalidation mechanism to refresh the UI.

### Aggregate Roots and entities

#### Q6 — GameSession as aggregate root
**Question:** Is GameSession an AggregateRoot?

**Answer:** Yes. GameSession extends `@hexadrop/aggregate-root`. It is the only AR that contains Player, Party, Roster, Inventory, and other session-scoped entities.

**Context:** This replaced an earlier decision to make each of those entities an independent AR. The centralized AR simplifies snapshots, save history, and deterministic replay.

#### Q7 — Battle as aggregate root
**Question:** Is Battle also an AggregateRoot?

**Answer:** Yes. Battle is an independent AR from v1.

**Context:** Battle has its own lifecycle, PRNG seed, events, and combat state. It is not a child entity of GameSession. Both GameSession and Battle are the only two ARs in v1.

#### Q8 — Entity event accumulation
**Question:** How do entities accumulate domain events?

**Answer:** Entities extend `@hexadrop/aggregate-root`. Both static factory methods (`create()`) and instance mutation methods record events internally. The command handler calls `pullEvents()` to drain and emit them.

#### Q9 — GameSession → Battle relationship
**Question:** Are GameSession and Battle coupled?

**Answer:** No. They are independent ARs with no direct reference. The Encounter use case orchestrates the transition: pauses exploration, creates a Battle, and when Battle completes, applies results to GameSession.

### Persistence

#### Q10 — Repository model
**Question:** Which entities have repositories?

**Answer:** Only Aggregate Roots have repositories. GameSession and Battle each have their own repository with IndexedDB, filesystem (Tauri/Capacitor), and in-memory implementations.

**Context:** GameSession contains all its child entities (Player, Party, etc.) and is persisted as one unit. Battle is also persisted independently as a snapshot. GameSession is loaded and composed from its repository at session start.

#### Q11 — Save snapshots
**Question:** Are both GameSession and Battle snapshotted?

**Answer:** Yes, both are persisted as independent snapshots.

**Context:** A player can save during a battle; Battle state must be restorable. Battle snapshots are ephemeral (destroyed when battle ends), but persistable while active.

### Package conventions

#### Q12 — Hexagonal layers
**Question:** What is the standard layer structure and dependency graph for domain packages?

**Answer:**
```
domain/       → nothing external (except domain of other packages via peerDeps)
application/  → domain
infrastructure/ → domain + application
presentation/ → application + domain (never infrastructure)
container/    → domain + application + infrastructure
```
`presentation/game/` and `presentation/editor/` are sub-entrypoints of `presentation/`.

#### Q13 — Entrypoints and exports
**Question:** What entrypoints does each domain package expose?

**Answer:** `./domain`, `./application`, `./infrastructure`, `./presentation`, `./presentation/game`, `./presentation/editor`, `./container`, `./manifest.json`. The `package.json` exports map uses `types` and `development` [conditions](https://nodejs.org/api/packages.html#conditional-exports). No root entrypoint (`.`).

#### Q14 — Barrel conventions
**Question:** How are entrypoint barrels structured?

**Answer:** One `index.ts` per layer that re-exports all public symbols with explicit named exports. Each entity or concept has its own file within the layer directory.

#### Q15 — Container entrypoint
**Question:** What does `./container` export?

**Answer:** A `register(container, options)` function. It registers the package's use cases and repository interfaces into the global IoC container. The `options` parameter lets the consumer select concrete implementations dynamically (e.g., in-memory for tests, IndexedDB for the browser).

#### Q16 — manifest.json
**Question:** What belongs in `manifest.json`?

**Answer:** Only packages that need to expose metadata include one. Fields: `editor` (panels, tools, eventNodes, schemaContributions), `game` (uiComponents, assetPaths), `locales`, `migrations`. The schema is open to evolution.

#### Q17 — Schemas
**Question:** Where do JSON Schemas live?

**Answer:** Co-located in each domain package. Packages declare their schema contributions in `manifest.json`. No centralized schema package is required in v1.

### DI and composition

#### Q18 — DI package
**Question:** Is the DI/React package part of hexadrop or Pocket Forge?

**Answer:** Pocket Forge. Hexadrop provides the IoC container; Pocket Forge adds the React-specific hooks: `useCommand(CommandClass)` and `useQuery(QueryClass)`.

#### Q19 — Wire-up location
**Question:** Where are concrete implementations wired?

**Answer:** In the generated project's composition entrypoint, not inside any `@pocket-forge/*` package. Each domain package's `register(container, options)` is called with the appropriate options per target (browser, Tauri, Capacitor, tests).

### Testing

#### Q20 — Test conventions
**Question:** Where do tests live?

**Answer:** Colocated with source code (`src/domain/creature.test.ts` beside `src/domain/creature.ts`). Cross-layer integration tests live in `tests/` at the package root level.

## Review checklist

- [x] Hexadrop provides the foundational abstractions (Command, Query, AggregateRoot, Event, Either, IoC, ValueObject).
- [x] GameSession and Battle are the only two Aggregate Roots in v1.
- [x] CQRS with Commands returning `Either<E, void>` and Queries returning data.
- [x] React integration via `useReactQuery` and `useReactCommand` in a dedicated Pocket Forge package.
- [x] Hexagonal layers per domain package with strict dependency rules.
- [x] Standard entrypoints: domain, application, infrastructure, presentation, presentation/game, presentation/editor, container, manifest.json.
- [x] Container entrypoint registers use cases and repos; options control concrete implementations.
- [x] Event bus from hexadrop, no wrapper needed.
- [x] Package names and responsibilities remain intentionally deferred.
