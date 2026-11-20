---
'@pocket-forge/combat-engine': minor
---

Keep composition rules in `./rules` and group built-in rules by concern.

`CombatCompositionRule` and `CombatGroupConstraints` now live in `@pocket-forge/combat-engine/rules`. The domain keeps only the engine contracts: `CombatRule`, `CombatCompositionHook`, `CombatCompletionHook`, and the hook type guards. Built-in rules are grouped into `rules/composition` and `rules/completion`.

**Breaking for 0.x consumers:** import `CombatCompositionRule` and `CombatGroupConstraints` from `@pocket-forge/combat-engine/rules`.
