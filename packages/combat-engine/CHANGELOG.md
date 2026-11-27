# @pocket-forge/combat-engine

## 0.1.0

### Minor Changes

- ad85923: Add a `./rules` entrypoint with the built-in `OneVersusOneCombatRule`, `TwoVersusTwoCombatRule`, and `ThresholdCombatCompletionRule`. Remove `kind`, `contractVersion`, and `CombatRuleFactory` from rules and completion rules; construct a concrete rule directly with its own `create(primitives, definitions)`.
- 6bbcdbe: Rename the `CombatCompletionHook` method to `evaluateCompletion`.
  
  `CombatCompletionHook.evaluate(combat)` is now `evaluateCompletion(combat)`, and `CombatRule.isCompletionHook` detects the new name. The engine invokes the renamed hook. The change makes the completion contract explicit and avoids colliding with unrelated `evaluate` methods on rules.
  
  **Breaking for 0.x consumers:** implement `evaluateCompletion` instead of `evaluate` on completion rules.
- d27b3ec: Keep composition rules in `./rules` and group built-in rules by concern.
  
  `CombatCompositionRule` and `CombatGroupConstraints` now live in `@pocket-forge/combat-engine/rules`. The domain keeps only the engine contracts: `CombatRule`, `CombatCompositionHook`, `CombatCompletionHook`, and the hook type guards. Built-in rules are grouped into `rules/composition` and `rules/completion`.
  
  **Breaking for 0.x consumers:** import `CombatCompositionRule` and `CombatGroupConstraints` from `@pocket-forge/combat-engine/rules`.
- a889ec6: Split Combat state from the Combat Engine.
  
  `@pocket-forge/combat` now exports only neutral state: `Combat`, `Combatant`, `CombatantGroup`, their primitives, and `CombatTransitionError`. The engine, setup, action resolver and Move binding contracts, rule base, hook contracts, transition, event, outcome, and resolution errors move to the new `@pocket-forge/combat-engine` package.
  
  **Breaking for 0.x consumers:** import engine types from `@pocket-forge/combat-engine/domain` and the built-in rules from `@pocket-forge/combat-engine/rules`. `@pocket-forge/combat/rulesets` is removed. `@pocket-forge/combat-engine` depends on `@pocket-forge/combat`; the reverse dependency is not allowed.
- 4622691: Compose Combat rules, action resolvers, and Move bindings through CombatEngine.
- 877f821: Make Combat events a typed, discoverable catalog.
  
  `CombatEvent` is now generic over its type and payload. The engine exports `COMBAT_EVENT_TYPES`, `CombatEventMap`, `CombatEventType`, `CoreCombatEvent`, `KnownCombatEvent`, and the `CombatEvents.completed` factory. Plugins register their own events by augmenting `CombatEventMap`, so `KnownCombatEvent` is a discriminated union of every event known to the program.
  
  **Breaking for 0.x consumers:** use `CombatEvents.completed` (or a plugin event builder) instead of a hardcoded `type` string, and use `KnownCombatEvent` for exhaustive handling.
- 9d05b10: Define pure Combat extension contracts.
- 7e4ec25: Remove the remaining metadata ids and the setup wiring check.
  
  `CombatRule` no longer carries an `id`: the concrete class is the identity,
  `CombatRulePrimitives` and `CombatRuleData` drop the field, and
  `CombatRuleErrorReason` drops `invalid-id`.
  
  `CombatActionResolver` is now `{ actions, resolve }`. Remove `id`, `supports`,
  `CombatActionSetPlugin`, the binding set `plugin` reference, the
  `invalid-plugin-id` reason, and `validatePlugin`; Move binding sets are
  `{ bindings }` and keep catalog validation in `CombatMoveBindingSet.create`.
  
  `CombatSetup.create` returns a `CombatSetup` directly. `CombatSetupError`,
  `CombatSetupErrorReason`, and the compatibility check are gone. There is no
  setup-time wiring check: a set whose action ids the wired resolver does not
  register fails when that resolver resolves it (the reference resolver rejects it
  as `invalid-action`).
- f08b07a: Turn `CombatOutcome` into a domain entity hierarchy.
  
  `CombatOutcome` now exposes `CombatOutcome.draw()` and `CombatOutcome.victory(winnerGroupId)` factories plus `isDraw()` and `isVictory()` type guards. Outcomes are immutable class instances instead of plain object literals.
  
  **Breaking for 0.x consumers:** replace `{ status: 'draw' }` and `{ status: 'victory', winnerGroupId }` literals with the factories, and use `isVictory()` when accessing `winnerGroupId`.
- 949aef1: Turn `CombatResolution` and `CombatTransition` into domain entities.
  
  Both are now classes with private constructors and `create` factories. The engine builds resolutions through `CombatResolution.create`, and action resolvers build transitions through `CombatTransition.create`. The result fields stay immutable, and both classes give future behaviour a domain home.
  
  **Breaking for 0.x consumers:** replace transition object literals with `CombatTransition.create(combat, events)`.
- caf11fd: Associate loose combat helpers with the classes they belong to.
  
  `ThresholdCompletionConfig` is now a class with a static `create` factory and static guards instead of a `readThresholdCompletionConfig` function. Composition validation lives on `CombatCompositionRule`, outcome comparison on `CombatEngine`, and the hook type guards on `CombatRule`.
  
  **Breaking for 0.x consumers:** replace `readThresholdCompletionConfig(attributes)` with `ThresholdCompletionConfig.create(attributes)`, and use `CombatRule.isCompositionHook` / `CombatRule.isCompletionHook` instead of the former domain-level guards.
- 211d393: Add the abstract Combat Rule model with its own configuration and hook-based participation.
- af6169f: Group the Combat Engine collaborators in one `CombatSetup`.
  
  `CombatEngine` now receives a `CombatSetup` instead of positional collaborators. `CombatSetup.create({ rules, actions, moveBindings })` returns the setup directly.
  
  **Breaking for 0.x consumers:** replace `new CombatEngine(ruleset, actions, actionSet, completion)` with `new CombatEngine(CombatSetup.create({ rules, actions, moveBindings }))`.
- 530ecc5: Simplify the Combat model by removing `name` from `CombatantGroup` and `CombatRule`. `CombatantGroup` is identified by `id`; `CombatRule` is identified by its concrete class. Remove all extension version compatibility: action resolvers and Move binding sets no longer declare or validate `contractVersion`, and the `ContractVersionValidator` port, the semver infrastructure adapter, the `./infrastructure` entrypoint, and the `semver` dependencies are gone. The `invalid-name` and `invalid-version-range` error reasons are removed too.
- 115a300: Rename Move bindings to action bindings.
  
  `CombatMoveBinding` is now `CombatActionBinding`, `CombatMoveBindingSet` is now `CombatActionBindingSet`, and their primitive and error types follow the same naming. `CombatEngineSetup` and `CombatActionContext` now expose `actionBindings` instead of `moveBindings`. The `duplicate-move-binding` error reason is now `duplicate-action-binding`.
  
  **Breaking for 0.x consumers:** update imports and constructor inputs to the new names.

### Patch Changes

- Updated dependencies [4de6fb4]
- Updated dependencies [a889ec6]
- Updated dependencies [c778a1c]
- Updated dependencies [530ecc5]
- Updated dependencies [1a98687]
  - @pocket-forge/attribute@0.1.0
  - @pocket-forge/combat@0.1.0
