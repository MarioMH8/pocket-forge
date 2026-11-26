# Turn declaration boundary

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #105 — Elegir un movimiento
> Task: #118 — Centralizar la validación de la declaración y verificar el bando contrario

## Scope and privacy

This document is internal to the Duelmon plugin. It records where a Phase 1
turn declaration is validated, the opposing-group rule, and the tests that pin
both. It does not define turn resolution, ordering, damage, or history.

The declaration remains input, not state: it is never stored in `Combat` and has
no pending or confirmed variant.

## What changed

Declaration validity used to live inside `UseMoveResolution`, so the rules only
ran while the action was already computing damage. The checks now live in
`DuelmonTurnDeclaration.validate`, and `DuelmonCombatPlugin` calls it before it
delegates a `useMove` binding. `UseMoveResolution` only resolves species, types,
and multipliers from a declaration that is already valid.

The validator checks, in this order:

1. the target uses the `combatant` scope and resolves to a combatant;
2. the actor exists;
3. the actor is active in its group;
4. the Move exists in the catalog;
5. the actor's creature knows the Move;
6. the target is active in its group;
7. the target belongs to the only opposing group.

Every rejection keeps the existing `reason` and `path`: `invalid-input` on
`input.actorId` or `input.moveId`, `rejected` on `input.actorId` or
`input.moveId`, and `invalid-target` on `input.target.scope` or
`input.target.id`.

## Opposing group

Phase 1 is one versus one. The validator requires exactly one group that is not
the actor's group and requires the target to belong to it. A target from the
actor's group, from an inactive subset, or from a third active group is
rejected. The third-group case is not reachable through a product-valid 1v1
combat, so its test uses a resolver-level fixture built from a started combat
with an added group.

## Phase 1 action set invariant

A Phase 1 turn declaration chooses a Move. Every Move in the Phase 1 content set
binds to the `useMove` action. Generic actions such as `modifyAttribute` stay
outside the turn-declaration contract; they are not Phase 1 Move declarations
and keep their own target semantics. The plugin only applies declaration
validation to the actions listed as declaration actions, currently `useMove`.

This is an explicit boundary, not a silent skip. A later story that binds a Move
to another action must add that action to the declaration contract or move the
validation into the turn service that dispatches every declaration.

## Tests

The boundary is covered by:

- [`plugins/duelmon/tests/domain/turn/duelmon-turn-declaration.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-turn-declaration.test.ts):
  validated fields, actor-group target, third-group target, and non-combatant
  target scope.
- [`plugins/duelmon/tests/integration/turn-declaration-boundary.test.ts`](../../plugins/duelmon/tests/integration/turn-declaration-boundary.test.ts):
  the active combatant chooses its second known Move (`tackle`) and the combat
  stays unchanged.
- The declaration matrix and the `modifyAttribute` action tests keep passing
  unchanged.

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/domain/turn/duelmon-turn-declaration.test.ts --conditions=development` | 4 pass, 0 fail, 15 expect() calls |
| `bun test plugins/duelmon/tests/integration/turn-declaration-boundary.test.ts --conditions=development` | 1 pass, 0 fail |
| `bun test plugins/duelmon --conditions=development` | 235 pass, 0 fail, 831 expect() calls, 28 files |
| `bun run test` | 482 pass, 0 fail, 2451 expect() calls, 56 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Validator checks actor, Move, and target | `DuelmonTurnDeclaration` unit tests and the declaration matrix | Pass |
| Validation runs at the plugin boundary for `useMove` | `DuelmonCombatPlugin.resolve` delegates with the validated declaration | Pass |
| `UseMoveResolution` only resolves damage data | Unit and product suites | Pass |
| Third-group target rejected | `rejects an active target from a third group` | Pass |
| Existing reasons and paths preserved | Declaration matrix and rejection guarantees | Pass |
| `modifyAttribute` excluded and documented | This document; its action tests unchanged | Pass |
| Second known Move accepted | `accepts the second known Move ...` | Pass |
| Declaration matrix intact | `bun test plugins/duelmon` | Pass |
| Results documented | This document | Pass |

## Acceptance criteria

- [x] `DuelmonTurnDeclaration` validates actor, Move, and opposing target.
- [x] The plugin validates `useMove` declarations before dispatch.
- [x] `UseMoveResolution` no longer validates the declaration.
- [x] An active target outside the single opposing group is rejected.
- [x] Existing reasons and paths are preserved.
- [x] `modifyAttribute` is documented as outside the Phase 1 declaration contract.
- [x] The second known Move is covered by a product test.
- [x] The full declaration matrix passes.
- [x] Results are documented.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #105 — Elegir un movimiento.
- Task #118 — Centralizar la validación de la declaración y verificar el bando contrario.
- [Turn declaration](./106-turn-declaration.md).
- [Declaration product tests](./111-declaration-product-tests.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
