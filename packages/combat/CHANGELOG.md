# @pocket-forge/combat

## 0.1.0

### Minor Changes

- a889ec6: Split Combat state from the Combat Engine.
  
  `@pocket-forge/combat` now exports only neutral state: `Combat`, `Combatant`, `CombatantGroup`, their primitives, and `CombatTransitionError`. The engine, setup, action resolver and Move binding contracts, rule base, hook contracts, transition, event, outcome, and resolution errors move to the new `@pocket-forge/combat-engine` package.
  
  **Breaking for 0.x consumers:** import engine types from `@pocket-forge/combat-engine/domain` and the built-in rules from `@pocket-forge/combat-engine/rules`. `@pocket-forge/combat/rulesets` is removed. `@pocket-forge/combat-engine` depends on `@pocket-forge/combat`; the reverse dependency is not allowed.
- 530ecc5: Simplify the Combat model by removing `name` from `CombatantGroup` and `CombatRule`. `CombatantGroup` is identified by `id`; `CombatRule` is identified by its concrete class. Remove all extension version compatibility: action resolvers and Move binding sets no longer declare or validate `contractVersion`, and the `ContractVersionValidator` port, the semver infrastructure adapter, the `./infrastructure` entrypoint, and the `semver` dependencies are gone. The `invalid-name` and `invalid-version-range` error reasons are removed too.

### Patch Changes

- c778a1c: Enforce combatant group membership in Combat.
- Updated dependencies [4de6fb4]
- Updated dependencies [1a98687]
- Updated dependencies [54d54b9]
  - @pocket-forge/attribute@0.1.0
  - @pocket-forge/creature@0.1.0
  - @pocket-forge/rng@0.0.1
