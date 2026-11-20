---
'@pocket-forge/combat-engine': minor
---

Turn `CombatActionDescriptor` into a domain entity.

It now has a private constructor, `CombatActionDescriptor.create(id, configDefinitions, validateConfig)`, and a `validate(config)` method. `CombatMoveBindingSet` uses the new method instead of reading the optional `validateConfig` callback directly.

**Breaking for 0.x consumers:** replace descriptor object literals with `CombatActionDescriptor.create(...)`.
