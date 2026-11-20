---
'@pocket-forge/combat-engine': minor
---

Turn `CombatResolution` and `CombatTransition` into domain entities.

Both are now classes with private constructors and `create` factories. The engine builds resolutions through `CombatResolution.create`, and action resolvers build transitions through `CombatTransition.create`. The result fields stay immutable, and both classes give future behaviour a domain home.

**Breaking for 0.x consumers:** replace transition object literals with `CombatTransition.create(combat, events)`.
