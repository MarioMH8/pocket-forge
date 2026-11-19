---
'@pocket-forge/combat': minor
---

Remove the remaining metadata ids and the setup wiring check.

`CombatRuleset` no longer carries an `id`: the concrete class is the identity,
`CombatRulesetPrimitives` and `CombatRulesetData` drop the field, and
`CombatRulesetErrorReason` drops `invalid-id`.

`CombatActionPlugin` is now `{ actions, resolve }`. Remove `id`, `supports`,
`CombatActionSetPlugin`, the action set `plugin` reference, the
`invalid-plugin-id` reason, and `validatePlugin`; action sets are
`{ bindings }` and keep catalog validation in `CombatActionSet.create`.

`CombatSetup.create` returns a `CombatSetup` directly. `CombatSetupError`,
`CombatSetupErrorReason`, and the compatibility check are gone, so a plugin
and an action set that do not belong together surface at resolve as an unknown
action instead of at setup creation.
