---
'@pocket-forge/combat-engine': minor
---

Rename the `CombatCompletionHook` method to `evaluateCompletion`.

`CombatCompletionHook.evaluate(combat)` is now `evaluateCompletion(combat)`, and `CombatRule.isCompletionHook` detects the new name. The engine invokes the renamed hook. The change makes the completion contract explicit and avoids colliding with unrelated `evaluate` methods on rules.

**Breaking for 0.x consumers:** implement `evaluateCompletion` instead of `evaluate` on completion rules.
