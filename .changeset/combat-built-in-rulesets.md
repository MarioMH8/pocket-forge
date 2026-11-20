---
'@pocket-forge/combat-engine': minor
---

Add a `./rules` entrypoint with the built-in `OneVersusOneCombatRule`, `TwoVersusTwoCombatRule`, and `ThresholdCombatCompletionRule`. Remove `kind`, `contractVersion`, and `CombatRuleFactory` from rules and completion rules; construct a concrete rule directly with its own `create(primitives, definitions)`.
