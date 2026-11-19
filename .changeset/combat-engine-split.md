---
'@pocket-forge/combat': minor
'@pocket-forge/combat-engine': minor
---

Split Combat state from the Combat Engine.

`@pocket-forge/combat` now exports only neutral state: `Combat`, `Combatant`, `CombatantGroup`, their primitives, and `CombatTransitionError`. The engine, setup, action plugin and action set contracts, ruleset base, completion rule contract, transition, event, outcome, and resolution errors move to the new `@pocket-forge/combat-engine` package.

**Breaking for 0.x consumers:** import engine types from `@pocket-forge/combat-engine/domain` and the built-in rules from `@pocket-forge/combat-engine/rulesets`. `@pocket-forge/combat/rulesets` is removed. `@pocket-forge/combat-engine` depends on `@pocket-forge/combat`; the reverse dependency is not allowed.
