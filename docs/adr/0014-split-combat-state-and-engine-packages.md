# Split Combat state and Combat engine into separate packages

> **Partially contradicts [ADR-0004](./0004-monorepo-per-bounded-context.md): the Combat bounded context now spans two packages instead of one.**
>
> **Revised 2026-11-21:** clarifies that `Combat` is the combat state root. There is no separate Battle aggregate; turn orchestration lives in concrete action services outside the state package, and persistence is a future `CombatRepository` concern.

The Combat context mixed two responsibilities in one package: neutral immutable state (`Combat`, `Combatant`, `Combatant Group`, the transition error) and the extension machinery that drives it (the Combat Engine, Combat Setup, action resolver and Move binding contracts, the Combat Rule base, the hook contracts, and the built-in rules). Consumers that only need to read or persist combat state still had to resolve the engine's contracts, and the state layer's barrel exposed types it never used. The split makes the direction explicit: `@pocket-forge/combat-engine` depends on `@pocket-forge/combat`, never the reverse. The aggregate keeps its own `CombatTransitionData` input, so it never needs to know what a Combat Event or Combat Outcome is.

`Combat` is the combat state root. It holds participant composition, RandomPocket state, battle attributes, and the active/completed lifecycle. The Combat Engine resolves one action at a time and evaluates completion hooks. Turn ordering, switching, priority, speed ties, and residual effects are orchestration and belong to concrete action services outside the state package, such as the Duelmon combat turn service. There is no separate Battle aggregate; the earlier Battle aggregate decision is superseded.

## Considered Options

- **Keep one package with subpath exports** (`./domain` and `./rules`): no new package metadata, but the state barrel still leaks engine contracts and the boundary stays conventional rather than enforced.
- **One package per collaborator** (rules, action resolver, Move bindings, completion hook): maximizes isolation but splits a single contract into several products that are only meaningful together.
- **Split state from engine** (selected): `@pocket-forge/combat` keeps the aggregate and participants; `@pocket-forge/combat-engine` keeps the engine, its contracts, and the built-in rules. The dependency graph stays acyclic and the engine's absence from the state package becomes a module-resolution fact, not a convention.
- **Extract only the `CombatEngine` class**: minimal churn, but the engine's contracts would still live in the state package, so the state barrel would keep exposing resolver and rule types.

## Consequences

- `@pocket-forge/combat/domain` now exports only `Combat`, `Combatant`, `CombatantGroup`, their primitives, and `CombatTransitionError`. This is a breaking change with no compatibility re-export, because re-exporting engine types from `combat` would create the reverse dependency.
- `@pocket-forge/combat-engine/domain` exports the engine, setup, resolution, action resolver, Move binding set, rule base, hook contracts, transition, event, outcome, and their errors. `@pocket-forge/combat-engine/rules` exports the built-in rules, including the composition and threshold completion rules.
- The engine resolves one action at a time. Turn ordering and switching are outside the engine; concrete action services own them.
- `CombatantGroup` may contain reserve combatants and up to two Active Combatants. The active subset is battle state, not composition.
- There is no separate Battle aggregate. `Combat` is the combat state root; the earlier Battle aggregate decision is superseded.
- `Combat` remains serializable through primitives. A `CombatRepository` is deferred until an application use case needs to persist an active combat; the state package does not add repository infrastructure now.
- `@pocket-forge/combat/rulesets` is removed; importers move to `@pocket-forge/combat-engine/rules`.
- The engine's peer dependencies are `@pocket-forge/combat` and `@pocket-forge/attribute`; the state package keeps `attribute`, `creature` (types only), and `rng`.
- ESLint rejects imports of `@pocket-forge/combat-engine` from `packages/combat`, and imports of `@pocket-forge/duelmon` from either package.
- The Combat glossary stays in `packages/combat/CONTEXT.md` and documents both packages; the context remains one bounded context for domain-modeling purposes.
- A registry or kind-based factory becomes worthwhile again when serialized content must choose an implementation by identifier; that would be a new decision, not a reason to re-merge the packages.
- **History:** the original ADR split state from engine but did not define the relationship between Combat and the earlier Battle aggregate. This revision makes Combat the state root and moves turn orchestration to concrete action services.
