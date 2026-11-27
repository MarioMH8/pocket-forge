# Turn declaration

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #105 — Elegir un movimiento
> Task: #106 — Definir la declaración de acción del turno

## Scope and privacy

This document is internal to the Duelmon plugin. It defines the shape of one
declared turn action in Phase 1: one actor, one Move, and one target. It does
not define actor activity, Move ownership, or target validity (task #107), the
rejection matrix (tasks #108 and #111), or turn resolution (story 4).

A declaration is input, not state. It is not added to `Combat`, it is not
persisted with the combat, and it has no pending or confirmed variant.

## Shape

```ts
interface DuelmonTurnDeclaration {
  readonly actorId: string;
  readonly moveId: string;
  readonly target: {
    readonly id: string;
    readonly scope: 'combatant';
  };
}
```

This is the conceptual Phase 1 shape. The plugin already parses it as
`DuelmonCombatInput`, whose target value object also supports the scopes used by
the other registered actions. No parallel value object is introduced: the
declaration is the action input, one instance per actor.

| Field | Meaning |
| --- | --- |
| `actorId` | Combatant declaring the action. |
| `moveId` | Exactly one Move; ownership by the actor's creature is validated in task #107. |
| `target` | Phase 1 target: an opposing combatant selected by id; activity and side are validated in task #107. |

`DuelmonCombatInput.parse` validates the runtime shape:

- `actorId` is a non-empty string;
- `moveId` is a non-empty string, so a declaration without a Move is rejected
  instead of selecting a default;
- `target` is an object with a supported scope, and a Phase 1 declaration uses
  `{ scope: 'combatant', id }`.

The shared input also carries the target scopes used by the other registered
actions. Rejecting a target that is not an active opposing combatant belongs to
task #107; declaring the action does not perform that check.

Fields outside the shape are ignored; they are not part of the parsed
declaration.

## One move per actor

A declaration carries a single `moveId`; the shape has no list of Moves. A
missing `moveId` is rejected instead of filling a default. A turn will consume
one declaration per actor; the turn service from story 4 will be responsible
for consuming the declaration set and resolving it.

## No state in Combat

`Combat` keeps only its identifier, groups, attributes, RandomPocket, and
active/completed lifecycle status. Declaring an action:

- returns a parsed `DuelmonCombatInput`;
- does not mutate the input object;
- does not mutate the `Combat`;
- does not add a pending or confirmed action to the `Combat`;
- does not offer PP, switching, items, or fleeing.

## Acceptance criteria

- [x] The declaration shape is defined and documented.
- [x] The declaration requires an actor, a Move, and a target; without
      `moveId` there is no declaration.
- [x] A declaration contains exactly one Move per actor.
- [x] Declaring does not mutate the combat.
- [x] There is no pending or confirmed state in `Combat`.
- [x] PP, switching, items, and fleeing are not offered.

The behaviour is covered by
[`plugins/duelmon/tests/domain/support/duelmon-combat.input.test.ts`](../../plugins/duelmon/tests/domain/support/duelmon-combat.input.test.ts).

The one-declaration-per-actor set is a turn-service contract. No set type is
introduced here because the turn service is out of scope.

## Handoff to later tasks

### Declaration validation (#107)

Validate the parsed declaration against the combat: the actor exists and is
active, the Move belongs to the actor's creature, and the target is an active
opposing combatant. Reuse `DuelmonFailure.fail` so every rejection keeps a
`reason` and a `path`.

### Validation boundary (#118)

The rules live in `DuelmonTurnDeclaration.validate`, not inside
`UseMoveResolution`. `DuelmonCombatPlugin` validates a `useMove` declaration
before dispatching it, so the action resolves only a declaration that is
already valid. The target must belong to the only opposing group; a third group
is not a Phase 1 target. Phase 1 move declarations bind every content Move to
`useMove`; generic actions such as `modifyAttribute` stay outside the
turn-declaration contract. See
[Turn declaration boundary](./118-turn-declaration-boundary.md).

### Rejection matrix (#108 and #111)

An invalid or absent declaration returns `Either.left(CombatResolutionError[])`
without resolving anything: no default Move, no partial state, no events, and
no randomness consumed.

A malformed Combat is not a declaration rejection. The combat start contract
already validates each group's `activeCombatantIds`, so the semantic views treat
a broken snapshot as a programmer error; the rejection matrix only covers
declarations resolved against a combat that satisfies the start contract.

### Combat Turn service (story 4)

The service receives one declaration per actor, orders them by priority and
effective Speed, resolves each action through the Combat Engine, and returns a
single `CombatResolution`. The declaration itself is never stored in `Combat`.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #105 — Elegir un movimiento.
- Task #106 — Definir la declaración de acción del turno.
- Task #107 — Validar la declaración contra el estado del combate.
- Task #108 — Rechazar declaraciones inválidas o ausentes con un fallo estructurado.
- Task #111 — Probar la declaración: válida, inválida y ausente.
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
