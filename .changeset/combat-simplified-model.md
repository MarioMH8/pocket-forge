---
'@pocket-forge/combat': minor
---

Simplify the Combat model by removing `name` from `CombatantGroup` and `CombatRuleset`, identifying both by `id` alone. Remove all extension version compatibility: action plugins and action sets no longer declare or validate `contractVersion`, `supports` only matches the plugin id, and the `ContractVersionValidator` port, the semver infrastructure adapter, the `./infrastructure` entrypoint, and the `semver` dependencies are gone. The `invalid-name` and `invalid-version-range` error reasons are removed too.
