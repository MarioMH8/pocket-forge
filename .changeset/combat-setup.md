---
'@pocket-forge/combat-engine': minor
---

Group the Combat Engine collaborators in one `CombatSetup`.

`CombatEngine` now receives a `CombatSetup` instead of positional collaborators. `CombatSetup.create({ rules, actions, moveBindings })` returns the setup directly.

**Breaking for 0.x consumers:** replace `new CombatEngine(ruleset, actions, actionSet, completion)` with `new CombatEngine(CombatSetup.create({ rules, actions, moveBindings }))`.
