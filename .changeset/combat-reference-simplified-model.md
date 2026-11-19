---
'@pocket-forge/combat-reference': minor
---

Simplify the reference plugin by removing `contractVersion` and the `ContractVersionValidator` dependency. `ReferenceCombatPlugin` now takes only the attribute definitions, `supports` only matches the plugin id, and `ReferenceCombatActionSet.create` no longer accepts a version validator. `REFERENCE_PLUGIN_VERSION` and `REFERENCE_PLUGIN_CONTRACT_RANGE` are removed.
