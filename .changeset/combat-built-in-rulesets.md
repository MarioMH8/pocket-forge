---
'@pocket-forge/combat': minor
---

Add a `./rulesets` entrypoint with the built-in `OneVersusOneCombatRuleset`, `TwoVersusTwoCombatRuleset`, and `ThresholdCombatCompletionRule`. Remove `kind`, `contractVersion`, and `CombatRulesetFactory` from rulesets and completion rules; construct a concrete ruleset directly with its own `create(primitives, definitions)`.
