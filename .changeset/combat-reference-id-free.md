---
'@pocket-forge/combat-reference': minor
---

Remove `ReferenceCombatPlugin.id`, its `supports` check, and
`REFERENCE_PLUGIN_ID`. Delete `ReferenceCombatActionSet`, its mother, and the
package's `./mother/domain` entrypoint. Callers validate authored bindings with
`CombatActionSet.create({ bindings }, plugin.actions)` from
`@pocket-forge/combat/domain`. `reference-combat.constants.ts` keeps only
`MODIFY_ATTRIBUTE_ACTION_ID`.
