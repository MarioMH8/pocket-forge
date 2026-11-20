---
'@pocket-forge/combat': minor
'@pocket-forge/combat-engine': minor
---

Simplify the Combat model by removing `name` from `CombatantGroup` and `CombatRule`. `CombatantGroup` is identified by `id`; `CombatRule` is identified by its concrete class. Remove all extension version compatibility: action resolvers and Move binding sets no longer declare or validate `contractVersion`, and the `ContractVersionValidator` port, the semver infrastructure adapter, the `./infrastructure` entrypoint, and the `semver` dependencies are gone. The `invalid-name` and `invalid-version-range` error reasons are removed too.
