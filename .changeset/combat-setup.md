---
'@pocket-forge/combat': minor
---

Group the Combat Engine collaborators in one validated `CombatSetup`.

`CombatEngine` now receives a `CombatSetup` instead of four positional collaborators. `CombatSetup.create` validates that the action plugin supports the configured action set and returns `CombatSetupError('incompatible-action-set', …)` when it does not.

**Breaking for 0.x consumers:** replace `new CombatEngine(ruleset, actions, actionSet, completion)` with `new CombatEngine(CombatSetup.create({ ruleset, actions, actionSet, completion }).getRight())`.

The incompatibility is now detected when the setup is created, not when an action is resolved. A caller that creates a setup with a compatible plugin and then mutates the plugin to become incompatible no longer sees a rejection at `resolve()`: a setup is a snapshot of a valid composition.
