---
'@pocket-forge/combat-reference': minor
---

Simplify the reference plugin by removing `contractVersion` and the `ContractVersionValidator` dependency. `ReferenceCombatPlugin` now takes only the attribute definitions. `REFERENCE_PLUGIN_VERSION` and `REFERENCE_PLUGIN_CONTRACT_RANGE` are removed.
