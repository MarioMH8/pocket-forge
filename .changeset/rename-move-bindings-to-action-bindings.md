---
'@pocket-forge/combat-engine': minor
---

Rename Move bindings to action bindings.

`CombatMoveBinding` is now `CombatActionBinding`, `CombatMoveBindingSet` is now `CombatActionBindingSet`, and their primitive and error types follow the same naming. `CombatEngineSetup` and `CombatActionContext` now expose `actionBindings` instead of `moveBindings`. The `duplicate-move-binding` error reason is now `duplicate-action-binding`.

**Breaking for 0.x consumers:** update imports and constructor inputs to the new names.
