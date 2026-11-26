# Recording the turn order in the history

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #127 — Registrar el orden en el historial
> Blocked by: #125, #126. Unblocks: #128.

## Scope and privacy

This document is internal to the Duelmon plugin. It records how a Phase 1 turn
exposes the actions it actually resolved, and how those actions are appended to
the basic combat history with their creature, Move, target, and successor
snapshot.

It does not change the Phase 1 speed order (#123), the declaration contract
(#124), the turn resolution (#125), the stop-after-completion contract (#126), or
the product test matrix of the story (#128). It adds no UI.

## Turn result

`DuelmonCombatTurn.resolve(combat, declarations)` returns
`Either<CombatEngineFailure[], DuelmonCombatTurnResult>`:

```ts
interface DuelmonCombatTurnResult {
  readonly actions: readonly DuelmonCombatTurnAction[];
  readonly resolution: CombatResolution;
}

interface DuelmonCombatTurnAction {
  readonly actorId: string;
  readonly combat: Combat;
  readonly moveId: string;
  readonly targetId: string;
}
```

- `resolution` is the single `CombatResolution` of Q15: the final combat, the
  merged events renumbered in turn order, and the reached outcome.
- `actions` lists exactly the actions the service resolved, in the real
  resolution order. Each action carries the declared actor, Move, and target,
  and the successor `Combat` snapshot the engine returned for it.
- A skipped declaration, or one the turn never reached because an earlier action
  completed the battle, does not appear in `actions`. The list is filled inside
  the same loop that calls the engine, so it is never inferred from the events.

Validation and failure behaviour do not change: the right side changed shape,
while a left side still returns the aggregated failures with no partial
resolution.

## History entries

`DuelmonCombatHistoryEntryKind` is now `'action' | 'start'`. The primitives gain
an optional action identity:

```ts
interface DuelmonCombatHistoryEntryPrimitives {
  readonly action?: { readonly actorId: string; readonly moveId: string; readonly targetId: string };
  readonly combat: CombatPrimitives;
  readonly kind: 'action' | 'start';
  readonly text: string;
}
```

| Field | Meaning |
| --- | --- |
| `action` | Actor, Move, and target identifiers; present exactly when `kind` is `action`. |
| `combat` | Canonical `Combat.toPrimitives()` snapshot of the recorded moment. |
| `kind` | `start` for the initial state, `action` for one resolved action. |
| `text` | Readable text for the same snapshot, plus the action line for an action entry. |

The invariant is `kind === 'action'` if and only if `action` is present. A start
entry keeps the field absent, so primitives written by #88 still hydrate
unchanged; an action entry without the field, or a start entry with it, is
rejected instead of producing an entry that contradicts its own kind.

## Recording a turn

`DuelmonCombatHistory.recordTurn(turn)` returns a new history with one action
entry per action of the turn result, in the same order:

```ts
const history = DuelmonCombatHistory.start(combat);
const recorded = history.recordTurn(turn.resolve(combat, declarations).getRight());
```

Each action entry is built from the action it records:

- its snapshot is `action.combat.toPrimitives()`, the successor `Combat` of that
  action;
- its text is `DuelmonCombatReport.fromCombat(action.combat).toString()`,
  preceded by one readable line that identifies the actor, the Move, and the
  target.

```text
player-emberling used ember-burst on opponent-aquafin

Combat "combat-1"

Group "player" (active: player-emberling)
  * player-emberling (emberling) [Fire] HP 99/99
...
```

The report and the snapshot come from the same `Combat`, so the text cannot
contradict the state the entry persists. No summary is written by hand: the
action line only names the action, while the report keeps rendering the state.

`recordTurn` is immutable: it never changes the receiver and returns a new
history. A turn without resolved actions appends nothing. Exactly one entry is
created per action, so the history cannot duplicate an action that happened
once.

## Order

History order is the turn result order, which is the Phase 1 resolution order
documented in [Phase 1 speed order](./123-speed-order.md): the fastest
combatant acts first, equal Speed falls back to the combatant position in the
`Combat`. The recorded actor sequence therefore matches `turn.actions` and the
`move-used`/`move-missed` events of `turn.resolution`:

```text
[start, action(player-emberling), action(opponent-aquafin)]
```

When an action completes the battle, the history records only that action. The
omitted declaration never reached the engine, so it has no action, no event, and
no entry.

## Invariants

1. **Real order.** Action entries follow the order in which the turn called the
   engine, not the declaration order and not an order derived from events.
2. **One entry per resolved action.** No action is recorded twice and no
   declaration that did not run is recorded.
3. **Identity in structure and text.** Every action entry carries `actorId`,
   `moveId`, and `targetId`, and its first line names the same three values.
4. **Snapshot and text agree.** The entry text reuses `DuelmonCombatReport` over
   the entry snapshot, so a reader and a consumer see the same state.
5. **Compatibility.** Start primitives stay valid without `action`; hydration
   and serialization round-trip without losing the action identity or snapshot.
6. **Immutability.** Recording returns a new history, and entry snapshots and
   action identities are detached copies.

## Tests

The behaviour is covered by:

- [`plugins/duelmon/tests/domain/history/duelmon-combat-history-entry.test.ts`](../../plugins/duelmon/tests/domain/history/duelmon-combat-history-entry.test.ts)
  for the action entry shape, text, snapshot, invariant, and detached copies.
- [`plugins/duelmon/tests/domain/history/duelmon-combat-history.test.ts`](../../plugins/duelmon/tests/domain/history/duelmon-combat-history.test.ts)
  for appending in order, immutability, empty turns, round-trip, and determinism.
- [`plugins/duelmon/tests/integration/turn-history.test.ts`](../../plugins/duelmon/tests/integration/turn-history.test.ts)
  with the real `DuelmonCombatPlugin`, the real action bindings, the real
  composition rule, `Gen1UseMoveMechanics`, and the real knockout rule.
- [`plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts)
  and [`plugins/duelmon/tests/integration/turn-resolution.test.ts`](../../plugins/duelmon/tests/integration/turn-resolution.test.ts)
  updated to read the resolution from the turn result without weakening the
  #125/#126 assertions.

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| The history shows the order of the actions | `records the real action order after the start`; `appends one action entry per resolved action in the turn order` | Pass |
| The order matches the real resolution | `records the real action order after the start` (events and `turn.actions`); `records the successor snapshot of each action` | Pass |
| Each entry identifies creature and Move | `records an action entry with its actor, Move, and target`; `records the real action order after the start` | Pass |
| Target is identified too | `records an action entry with its actor, Move, and target`; `identifies the action in the readable text and reuses the report` | Pass |
| No duplicated entries | `does not duplicate an action`; `records exactly the completing action when the first action ends the battle` | Pass |
| No action that did not happen | `records exactly the completing action when the first action ends the battle`; `adds no entry for a turn without resolved actions` | Pass |
| The history is readable without implementation knowledge | `identifies the action in the readable text and reuses the report`; `keeps the action text consistent with its serialized snapshot` | Pass |
| The previous history is not mutated | `does not mutate the previous history`; `does not mutate the previous history and round-trips the recorded one` | Pass |
| Determinism and reproducibility | `is deterministic for the same start and turn`; `is reproducible from the same starting point` | Pass |
| Primitives round-trip | `round-trips action primitives`; `round-trips recorded action entries through primitives` | Pass |

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon --conditions=development` | 309 pass, 0 fail, 1078 expect() calls, 33 files |
| `bun run test` | 556 pass, 0 fail, 2698 expect() calls, 61 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

## Acceptance criteria

- [x] The history shows the order of the actions.
- [x] The order matches the real resolution.
- [x] Each entry identifies creature and Move.
- [x] There are no duplicated entries or actions that did not happen.
- [x] The history is readable to a person who does not know the implementation.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #127 — Registrar el orden en el historial.
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md) — Q15.
- [Start history](./88-start-history.md).
- [Phase 1 turn resolution](./125-resolve-order.md).
- [Stopping the turn after the combat completes](./126-stop-after-completion.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
