# Declaration product tests

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #105 — Elegir un movimiento
> Task: #111 — Probar la declaración: válida, inválida y ausente

## Scope and privacy

This document is internal to the Duelmon plugin. It records the product test
matrix for one Phase 1 turn declaration: valid, invalid, absent, and two active
combatants declaring without resolving a turn.

The declaration is input, not state. These tests do not resolve a turn, order
actions, apply damage, record history, or expose a screen. Those behaviours
belong to stories 4 and 7. Phase 1 has no turn service yet, so a declaration is
validated through the production action resolver and the resulting transition
is never applied to the input combat.

The matrix exercises the production start contract and the production action
resolver. It does not go through `CombatEngine` or `OneVersusOneCombatRule`;
composition validation is a separate product concern and is out of scope for
this task.

## Fixture

The combat is built through the real start contract, not from hand-built
primitives: `DuelmonCombatStart.fromContent` receives the fixed
`DuelmonCombatStartMother.request()` and the fixture catalog. The resulting
`Combat` is the same initial state used by the start product tests.

| Field | Value |
| --- | --- |
| Combat id | `combat-1` |
| Groups | `player`, `opponent` |
| Active combatants | `player-emberling`, `opponent-aquafin` |
| Player creature | `emberling`, Fire, moves `ember-burst`, `tackle` |
| Opponent creature | `aquafin`, Water, moves `aqua-burst`, `tackle` |
| Random state | `{ seed: 42, state: 42 }` |

The declaration is validated by the composed plugin from
`DuelmonCombatMother.plugin()`, with `useMove` bindings for the declared Moves.
The valid Moves come from the same fixture catalog the start used.

### Inactive actor and target

The start contract and the `OneVersusOneCombatRule` both require exactly one
combatant per group, so a product-valid Phase 1 combat cannot contain an
inactive actor or target. These two rejections are therefore unreachable
through the product start path.

The scenarios use a resolver-level fixture derived from the started primitives:
one reserve combatant per group (`player-reserve`, `opponent-reserve`) while
keeping the original active subset. The snapshot is a valid `Combat` with
consistent membership and active subset, but it is not a product-reachable 1v1
combat; the engine composition rule would reject it. The fixture exists only to
exercise the resolver's activity guard. The matrix calls the action resolver
directly, so composition validation is intentionally out of scope.

## Product scenarios

The product tests live in
[`plugins/duelmon/tests/integration/turn-declaration.test.ts`](../../plugins/duelmon/tests/integration/turn-declaration.test.ts).

### Valid declaration

`player-emberling` declares `ember-burst` against the active opposing
`opponent-aquafin`. The declaration is accepted (`Either.right`) and the input
combat is unchanged. The returned transition is not applied.

### Unknown actor

An actor that is not present in any group (`missing-actor`) is rejected with
`reason: 'invalid-input'` and `path: 'input.actorId'`. The combat is unchanged.

### Inactive actor

A combatant that exists in the player group but is not in its active subset
(`player-reserve`) is rejected with `reason: 'rejected'` and
`path: 'input.actorId'`. The combat is unchanged. This case uses the
resolver-level reserve fixture described above, not a product-reachable 1v1
combat.

### Unknown Move

A Move that does not exist in the Duelmon catalog (`missing-move`) is rejected
with `reason: 'invalid-input'` and `path: 'input.moveId'`. The binding exists so
the declaration reaches catalog validation instead of failing at binding lookup.
The combat is unchanged.

### Move known to the catalog but not to the creature

`player-emberling` declares `aqua-burst`. The Move exists in the catalog and is
known by the opponent's creature, but not by the actor's creature. It is
rejected with `reason: 'rejected'` and `path: 'input.moveId'`. The combat is
unchanged.

### Invalid target

Two Phase 1 invalid targets are covered:

- The actor itself (`player-emberling`) is rejected with
  `reason: 'invalid-target'` and `path: 'input.target.id'`.
- A reserve combatant of the opposing group (`opponent-reserve`) that is not in
  its active subset is rejected with `reason: 'invalid-target'` and
  `path: 'input.target.id'`.

The combat is unchanged in both cases. The reserve case uses the resolver-level
fixture described above, not a product-reachable 1v1 combat.

### Absent declaration

A declaration without `moveId` is rejected with `reason: 'invalid-input'` and
`path: 'input.moveId'`. A binding for the actor's first Move exists, so a
default-Move fallback would have resolved instead of rejecting. The combat is
unchanged and no Move is chosen by default.

### Combat state intact

Every rejection asserts that `combat.toPrimitives()` still equals the snapshot
taken before the declaration. That snapshot includes the groups, every
combatant, the RandomPocket state, and the lifecycle status, so a rejection
neither mutates the battle nor advances the turn or consumes randomness.

### Both active combatants declare

`player-emberling` declares `ember-burst` against `opponent-aquafin`, and
`opponent-aquafin` declares `aqua-burst` against `player-emberling`. Both
declarations are accepted against the same unchanged combat, and neither
transition is applied.

This test is a plugin-boundary check: it proves that each active combatant can
declare independently and that the combat stays unchanged. The declaration set
(#124) and the turn service (#125) later compose the two declarations into one
turn; that contract is covered by their own product tests, not by this plugin
scenario.

### Value over the unit tests

These scenarios overlap with the #107 and #108 unit tests by design: the
product matrix re-runs the same rules against the combat produced by the start
contract instead of a hand-built fixture. The reserve-based inactive actor and
target fixtures and the both-declare case add shapes the unit fixtures do not
cover; the remaining cases confirm that the start-produced identifiers flow
through the same rejection paths.

## Results

Executed on 2026-11-25:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/integration/turn-declaration.test.ts --conditions=development` | 9 pass, 0 fail, 49 expect() calls |
| `bun test plugins/duelmon --conditions=development` | 230 pass, 0 fail, 813 expect() calls, 26 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass, no findings |

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Valid declaration | `accepts a declaration from the active combatant against the active opponent` | Pass |
| Unknown actor | `rejects an unknown actor and keeps the combat intact` | Pass |
| Inactive actor | `rejects an inactive actor and keeps the combat intact` (resolver-level reserve fixture, not a 1v1 product combat) | Pass |
| Inactive opposing target | `rejects an inactive opposing target and keeps the combat intact` (same fixture) | Pass |
| Unknown Move | `rejects an unknown Move and keeps the combat intact` | Pass |
| Move known to the catalog but not to the creature | `rejects a catalog Move the creature does not know and keeps the combat intact` | Pass |
| Invalid target | `rejects the actor itself as target and keeps the combat intact` | Pass |
| Absent declaration | `rejects an absent declaration and keeps the combat intact` | Pass |
| Combat state intact after each rejection | Every rejection test asserts the unchanged primitives | Pass |
| Two active combatants declare without resolving | `accepts a declaration from each active combatant without resolving the turn` | Pass |
| Results documented | This document | Pass |

## Acceptance criteria

- [x] A valid declaration is accepted without changing the combat.
- [x] An unknown actor is rejected.
- [x] An inactive actor is rejected.
- [x] An unknown Move is rejected.
- [x] A catalog Move the creature does not know is rejected.
- [x] An invalid target is rejected.
- [x] An absent declaration is rejected without a default Move.
- [x] Every rejection leaves the combat intact.
- [x] Two active combatants declare without resolving the turn.
- [x] The results are documented.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #105 — Elegir un movimiento.
- Task #106 — [Definir la declaración de acción del turno](./106-turn-declaration.md).
- Task #107 — Validar la declaración contra el estado del combate.
- Task #108 — Rechazar declaraciones inválidas o ausentes con un fallo estructurado.
- Task #111 — Probar la declaración: válida, inválida y ausente.
- [Start product tests](./89-start-product-tests.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
