# Phase 1 turn declarations

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #124 — Recibir las dos declaraciones válidas del turno desde la historia 3
> Blocked by: #123. Unblocks: #125.

## Scope and privacy

This document is internal to the Duelmon plugin. It records how Phase 1 receives
the two declarations of one turn, validates them together, and exposes the
result without resolving anything.

It does not order the declarations by Speed, resolve their actions, apply
effects, record history, or stop after a knockout. Those belong to #125–#128.
It does not introduce a turn service or a pending-action state in `Combat`.

## Contract

A Phase 1 turn receives exactly one declaration per combat group. The set is
built from the combat, the catalog, and the unparsed declarations:

```ts
const set = DuelmonTurnDeclarations.receive(catalog, combat, [
  { actorId: 'player-emberling', moveId: 'ember-burst', target: { id: 'opponent-aquafin', scope: 'combatant' } },
  { actorId: 'opponent-aquafin', moveId: 'aqua-burst', target: { id: 'player-emberling', scope: 'combatant' } },
]);
```

Each declaration keeps the shape defined by
[the turn declaration](./106-turn-declaration.md): one actor, one Move, and one
`combatant` target. The set returns
`Either<CombatResolutionError[], DuelmonTurnDeclarations>`; a right result only
exists when both declarations are valid.

`DuelmonTurnDeclarations` exposes:

| Member | Meaning |
| --- | --- |
| `declarations()` | The two validated declarations in combat order: group order, then combatant order. |
| `declarationForGroup(groupId)` | The declaration of one group, or `undefined`. |
| `declarationForActor(actorId)` | The declaration of one actor, or `undefined`. |

The result is independent of the order in which the declarations arrive. Speed
ordering is not applied here; #125 sorts these declarations with
`DuelmonSpeedOrder`.

## Rules

1. The combat must be the Phase 1 shape: exactly two groups and exactly one
   active combatant per group. A different shape is rejected as
   `incompatible-contract`.
2. The received value must be an array with exactly two entries. A missing,
   empty, or differently sized list is rejected as `invalid-input` on
   `declarations`.
3. Each entry is parsed by `DuelmonCombatInput.parse`. The parser owns the input
   shape: non-empty `actorId` and `moveId`, and a supported target object.
4. Each parsed declaration is validated by `DuelmonTurnDeclaration.validate`.
   The set reuses that rule set instead of repeating it: the actor exists and is
   active, the Move exists in the catalog and is known by the actor's creature,
   and the target is an active combatant of the only opposing group. The set
   then applies `Phase1MoveConstraints` at the turn boundary, so a Move outside
   the Phase 1 support policy is rejected with `rejected` on `input.moveId`.
5. Exactly one declaration per group is accepted. The same actor declared twice
   is rejected, and a second declaration for an already declared group is also
   rejected.
6. Nothing is resolved until both declarations are valid. A failed receive
   returns every failure found in the pass and no partial set; it emits no
   events, produces no transition, and consumes no `RandomPocket`.
7. The `Combat` passed to the set is never changed. A declaration is input, not
   state, so the snapshot keeps exactly the same primitives before and after.

## Rejection matrix

Paths inside a declaration are prefixed with its position in the received list,
for example `declarations.0.input.actorId`.

| Scenario | Reason | Path |
| --- | --- | --- |
| Received value is absent or not an array | `invalid-input` | `declarations` |
| List length is not exactly two | `invalid-input` | `declarations` |
| A group has no declaration | `invalid-input` | `declarations` |
| Entry is absent, `null`, or not an object | `invalid-input` | `declarations.<index>.input` |
| `actorId` is missing or empty | `invalid-input` | `declarations.<index>.input.actorId` |
| Actor is unknown | `invalid-input` | `declarations.<index>.input.actorId` |
| Actor is not active in its group | `rejected` | `declarations.<index>.input.actorId` |
| Same actor is declared twice | `invalid-input` | `declarations.<index>.input.actorId` |
| `moveId` is missing or empty | `invalid-input` | `declarations.<index>.input.moveId` |
| Move is unknown to the catalog | `invalid-input` | `declarations.<index>.input.moveId` |
| Move is known to the catalog but not by the creature | `rejected` | `declarations.<index>.input.moveId` |
| Move is outside the Phase 1 support policy (Status, no power, can miss, non-zero priority, effects, flags) | `rejected` | `declarations.<index>.input.moveId` |
| Target is absent or not an object | `invalid-input` | `declarations.<index>.input.target` |
| Target scope is not `combatant` | `invalid-target` | `declarations.<index>.input.target.scope` |
| Target is unknown, inactive, from the actor group, or outside the only opposing group | `invalid-target` | `declarations.<index>.input.target.id` |
| Combat has a number of groups other than two | `incompatible-contract` | `combat.groups` |
| A group has a number of active combatants other than one | `incompatible-contract` | `combat.groups.<index>.attributes.activeCombatantIds` |

All failures found in one pass are aggregated. When several declarations fail,
the result keeps one error per failure instead of stopping at the first one.
Combat shape is checked first: when the combat is not Phase 1, the set returns
the shape failures and does not attempt to map declarations to groups. Once the
shape holds, declaration failures are aggregated across both entries.

## Tests

The behaviour is covered by
[`plugins/duelmon/tests/domain/turn/duelmon-turn-declarations.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-turn-declarations.test.ts)
with the started combat fixture from `DuelmonCombatStartMother`.

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Exactly one declaration per group is accepted | `accepts one valid declaration per group in both input orders`; `orders the declarations by the combat, not by the input`; `follows the group order of the combat` | Pass |
| A missing declaration is rejected | `rejects an absent declaration list`; `rejects an empty declaration list`; `rejects a list with a single declaration`; `rejects an absent entry in the declaration list` | Pass |
| Every failure found in one pass is aggregated | `aggregates failures from both declarations in one pass` | Pass |
| A duplicated declaration is rejected | `rejects a duplicated declaration for the same actor` | Pass |
| Each declaration refers to its group's active creature | `rejects an unknown actor`; `rejects an inactive actor` | Pass |
| No Move outside Phase 1 is accepted | `rejects an unknown Move`; `rejects a catalog Move the creature does not know` | Pass |
| No target outside Phase 1 is accepted | `rejects a target from the actor group`; `rejects a target outside the Phase 1 combatant scope` | Pass |
| A combat that is not strict 1v1 is rejected | `rejects a combat with more than two groups`; `rejects a combat with two active combatants in a group` | Pass |
| Nothing is resolved until both declarations are valid | `does not change the combat or resolve anything when both declarations are valid`; `does not change the combat when a declaration is rejected` | Pass |
| The result is independent of the input order | `accepts one valid declaration per group in both input orders`; `orders the declarations by the combat, not by the input` | Pass |
| Declarations are searchable for #125 | `finds declarations by group and actor` | Pass |

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/domain/turn/duelmon-turn-declarations.test.ts --conditions=development` | 20 pass, 0 fail, 53 expect() calls |
| `bun test plugins/duelmon --conditions=development` | 266 pass, 0 fail, 905 expect() calls, 30 files |
| `bun run test` | 513 pass, 0 fail, 2525 expect() calls, 58 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #124 — Recibir las dos declaraciones válidas del turno desde la historia 3.
- [Turn declaration](./106-turn-declaration.md).
- [Turn declaration boundary](./118-turn-declaration-boundary.md).
- [Phase 1 speed order](./123-speed-order.md).
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md) — Q15.
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
