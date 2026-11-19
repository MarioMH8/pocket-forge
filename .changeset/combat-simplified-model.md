---
'@pocket-forge/combat': minor
---

Simplify the Combat model by removing `name` from `CombatantGroup` and `CombatRuleset`. `CombatantGroup` is identified by `id`; `CombatRuleset` is identified by its concrete class. Remove all extension version compatibility: action plugins and action sets no longer declare or validate `contractVersion`, and the `ContractVersionValidator` port, the semver infrastructure adapter, the `./infrastructure` entrypoint, and the `semver` dependencies are gone. The `invalid-name` and `invalid-version-range` error reasons are removed too.
