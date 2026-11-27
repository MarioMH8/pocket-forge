# Phase 1 turn resolution

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #125 — Resolver las acciones en el orden correcto
> Blocked by: #123, #124. Unblocks: #126, #127.

## Scope and privacy

This document is internal to the Duelmon plugin. It records how a Phase 1 turn
orders the two validated declarations, resolves each declared action through the
Combat Engine, and returns one resolution.

It does not keep history (#127), nor does it own the knockout stop contract, the
winner rules, or "no actions after the end" (#126). It contains only the basic
guard requested by #125: an actor without positive hit points is skipped, and the
loop stops when an action completes the combat.

## Contract

`DuelmonCombatTurn` is the turn service. It is built from the Duelmon catalog and
a composed `CombatEngine`; the engine already carries its rules, action
bindings, and action resolver, so the service does not duplicate them:

```ts
const turn = new DuelmonCombatTurn(catalog, engine);
const resolution = turn.resolve(combat, [
  { actorId: 'player-emberling', moveId: 'ember-burst', target: { id: 'opponent-aquafin', scope: 'combatant' } },
  { actorId: 'opponent-aquafin', moveId: 'aqua-burst', target: { id: 'player-emberling', scope: 'combatant' } },
]);
```

`resolve(combat, declarations)` returns
`Either<CombatEngineFailure[], CombatResolution>`. A right result carries a single
`CombatResolution` with the final `Combat`, the merged events of the turn, and the
engine outcome when one of the actions completed the combat.

The steps are:

1. `DuelmonTurnDeclarations.receive(catalog, combat, declarations)` parses and
   validates both declarations. A rejected set returns its failures and resolves
   nothing.
2. The declarations are ordered with `DuelmonSpeedOrder.fromCombat(combat)`,
   wrapping each `Combatant` snapshot into a `DuelmonCombatant` view.
3. Each declaration is resolved in sequence through
   `engine.resolve(combatVigente, input)`, using the `resolution.combat` of the
   previous action as the next current state.
4. The events of every action are merged in turn order and renumbered from one.
5. The service returns one `CombatResolution.create(combatFinal, events, outcome)`.

## Order

The service builds `DuelmonSpeedOrder` once from the combat that starts the turn
and sorts the declarations with it. Higher Speed goes first; equal Speed falls
back to the combatant position in the `Combat` (group order, then combatant
order). The order is the Phase 1 one documented in
[Phase 1 speed order](./123-speed-order.md): priority, stat stages, paralysis,
and random tie-breaks are not applied.

## State update

The current combat starts as the received snapshot. After every action, the
service replaces it with `resolution.combat`, so the next action is validated
and resolved against the state produced by the previous one. This is why the
service passes primitives to the engine:

```ts
const actionInput = {
  actorId: declaration.actor.id,
  moveId: declaration.moveId,
  target: { id: declaration.target.id, scope: 'combatant' },
};
```

The plugin re-parses that input and re-validates it against the combat it
receives. Passing the `Combatant` objects captured by the declaration would
resolve against obsolete data (for example, HP before the previous hit).
The service resolves exactly the declared Move and never substitutes or adds an
action.

Before resolving an action, the actor is looked up in the vigent combat. When
its `hp` is zero or below, the action is skipped:

```ts
if (!DuelmonCombatTurn.isStanding(current, declaration.actor.id)) {
  continue;
}
```

This is the Phase 1 "still standing" criterion. The broader knockout contract
belongs to #126.

## Events

Every individual engine resolution numbers its events from one. The turn merges
them in turn order and renumbers them continuously from one, using the number of
already-merged events as the offset. For two actions that emit one event each,
the turn returns sequences `[1, 2]`; if an action emits two events, the turn
returns `[1, 2, 3, 4]`. Event types and payloads are preserved; only `sequence`
changes.

## Outcome and failure

When an action completes the combat, the engine returns the reached outcome and
a completed successor. The service keeps that outcome, merges the completion
event in turn order, and stops the loop, so no action is resolved against a
completed combat.

If `DuelmonTurnDeclarations.receive` fails, the service returns those failures and
does not call the engine. If a later action fails, the service returns the engine
failures instead of a partial resolution. The caller keeps the original `Combat`
and `RandomPocket`: the engine and the actions are pure, and the service never
persists a partial state. This also means an invalid declaration consumes no
randomness; the input `RandomPocket` stays unchanged.

## What is not applied

Phase 1 reads raw Speed only. The turn does not apply:

- Move priority or effective Speed;
- stat stages or paralysis;
- random tie-breaks;
- PP consumption, switching, or residual effects;
- action history or the knockout stop matrix (see #126 and #127).

## Tests

The behaviour is covered by:

- [`plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts)
  with a recording resolver stub and the started combat fixture from
  `DuelmonCombatStartMother`.
- [`plugins/duelmon/tests/integration/turn-resolution.test.ts`](../../plugins/duelmon/tests/integration/turn-resolution.test.ts)
  with the real `DuelmonCombatPlugin`, the real action bindings, the real
  composition rule, and `Gen1UseMoveMechanics`.

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| The fastest creature acts first | `resolves the fastest declared actor first and the slower one afterwards`; `resolves the faster combatant first and the slower one afterwards` | Pass |
| The slower creature acts afterwards when still standing | `threads the successor combat of each action into the next action`; `skips an actor that is no longer standing when its action comes up`; `updates the battle state after each action` | Pass |
| Battle state is updated after every action | `threads the successor combat of each action into the next action`; `updates the battle state after each action` | Pass |
| Exactly the declared Move of each side is resolved | `resolves exactly the Move declared by each side and no other action`; `resolves exactly the Move declared by each side` | Pass |
| No action outside the declarations is resolved | `resolves exactly the Move declared by each side and no other action`; `does not resolve actions outside the declarations`; `does not resolve anything or consume randomness when a declaration is invalid` | Pass |
| Equal Speed applies the fixed order | `breaks equal speeds by the fixed combat order`; `applies the fixed tie order when both combatants have the same Speed` | Pass |
| One resolution with renumbered events | `merges and renumbers the events of every action continuously`; `updates the battle state after each action` | Pass |
| The engine outcome is kept and the loop stops | `keeps the engine outcome and stops when an action completes the combat` | Pass |
| A failure returns no partial resolution and no randomness is consumed | `returns the engine failures instead of a partial resolution`; `does not resolve anything or consume randomness when a declaration is invalid`; `does not change the input combat` | Pass |

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon --conditions=development` | 282 pass, 0 fail, 967 expect() calls, 32 files |
| `bun run test` | 529 pass, 0 fail, 2587 expect() calls, 60 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

## Acceptance criteria

- [x] The fastest creature acts first.
- [x] The slower creature acts afterwards when it is still standing.
- [x] The battle state is updated after every action.
- [x] Exactly the declared Move of each side is resolved.
- [x] No action outside the declarations is resolved.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #125 — Resolver las acciones en el orden correcto.
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md) — Q15.
- [Phase 1 speed order](./123-speed-order.md).
- [Phase 1 turn declarations](./124-turn-declarations.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
