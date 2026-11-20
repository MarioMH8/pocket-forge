---
'@pocket-forge/combat-engine': minor
---

Associate loose combat helpers with the classes they belong to.

`ThresholdCompletionConfig` is now a class with a static `create` factory and static guards instead of a `readThresholdCompletionConfig` function. Composition validation lives on `CombatCompositionRule`, outcome comparison on `CombatEngine`, and the hook type guards on `CombatRule`.

**Breaking for 0.x consumers:** replace `readThresholdCompletionConfig(attributes)` with `ThresholdCompletionConfig.create(attributes)`, and use `CombatRule.isCompositionHook` / `CombatRule.isCompletionHook` instead of the former domain-level guards.
