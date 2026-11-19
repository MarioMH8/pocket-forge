---
'@pocket-forge/combat-engine': minor
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
`CombatSetupErrorReason`, and the compatibility check are gone. There is no
setup-time wiring check: a set whose action ids the wired plugin does not
register fails when that plugin resolves it (the reference plugin rejects it
as `invalid-action`).
