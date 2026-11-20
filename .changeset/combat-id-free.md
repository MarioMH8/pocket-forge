---
'@pocket-forge/combat-engine': minor
---

Remove the remaining metadata ids and the setup wiring check.

`CombatRule` no longer carries an `id`: the concrete class is the identity,
`CombatRulePrimitives` and `CombatRuleData` drop the field, and
`CombatRuleErrorReason` drops `invalid-id`.

`CombatActionResolver` is now `{ actions, resolve }`. Remove `id`, `supports`,
`CombatActionSetPlugin`, the binding set `plugin` reference, the
`invalid-plugin-id` reason, and `validatePlugin`; Move binding sets are
`{ bindings }` and keep catalog validation in `CombatMoveBindingSet.create`.

`CombatSetup.create` returns a `CombatSetup` directly. `CombatSetupError`,
`CombatSetupErrorReason`, and the compatibility check are gone. There is no
setup-time wiring check: a set whose action ids the wired resolver does not
register fails when that resolver resolves it (the reference resolver rejects it
as `invalid-action`).
