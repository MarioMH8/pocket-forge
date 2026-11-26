# Turn order product tests

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #128 — Probar velocidad distinta, velocidad igual y debilitamiento en la primera acción
> Blocked by: #123–#127

## Scope and privacy

This document is internal to the Duelmon plugin. It records the product test
matrix for the Phase 1 turn order: different Speed, equal Speed, a knockout in
the first action, missing or invalid declarations, the order recorded in the
history, and the guarantees that no priority, stat stages, or random tie-breaks
participate.

The tests add no production behaviour. They exercise the contracts already
delivered by #123–#127 through the real product flow: content, combat start,
turn resolution, and history. They do not cover UI, persistence, switching,
items, fleeing, or the Phase 2 priority and random-tie rules.

## Product flow

Every scenario goes through the same production path. The engine, plugin,
actions, bindings, and rules are real; the suite contains no engine or plugin
double.

| Stage | Production contract |
| --- | --- |
| Content | `DuelmonCombatStartMother.request()` and the fixture catalog from `@pocket-forge/duelmon-dataset` |
| Start | `DuelmonCombatStart.fromContent` |
| Engine | `CombatEngine` composed with `DuelmonCombatMother.plugin()` (`DuelmonCombatPlugin` + `Gen1UseMoveMechanics`), `useMoveBindings`, `OneVersusOneCombatRule`, and, for knockout scenarios, the real `ThresholdCombatCompletionRule` (`hp <= 0`, opposing group wins) |
| Turn | `DuelmonCombatTurn.resolve` with the two declarations |
| History | `DuelmonCombatHistory.start` and `recordTurn` |

## Fixture

The started combat is the one used by the start, declaration, resolution, and
history tasks.

| Field | Value |
| --- | --- |
| Combat id | `combat-1` |
| Groups | `player`, `opponent` |
| Active combatants | `player-emberling`, `opponent-aquafin` |
| Player creature | `emberling`, Fire, HP 99/99, Speed 70, moves `ember-burst`, `tackle` |
| Opponent creature | `aquafin`, Water, HP 104/104, Speed 48, moves `aqua-burst`, `tackle` |
| Random state | `{ seed: 42, state: 42 }` |

The real Gen 1 damage slice makes seed 42 deterministic, so the tests pin exact
state. For the default Speed order (`ember-burst` then `aqua-burst`):

| Step | Event | State after the action |
| --- | --- | --- |
| Start | — | player 99/99, opponent 104/104 |
| Action 1: `player-emberling` uses `ember-burst` | damage 15, effectiveness 0.5 | player 99/99, opponent 89/104 |
| Action 2: `opponent-aquafin` uses `aqua-burst` | damage 42, effectiveness 2 | player 57/99, opponent 89/104 |

When the opponent acts first with the same seed, the RNG draws move to the
opponent: `aqua-burst` deals 45 (player 54/99) and the following `ember-burst`
deals 14 (opponent 90/104).

## Product scenarios

The product tests live in
[`plugins/duelmon/tests/integration/turn-order-product.test.ts`](../../plugins/duelmon/tests/integration/turn-order-product.test.ts).

### Different Speed

The faster combatant acts first in both directions:

- With the fixture Speeds (player 70, opponent 48), `turn.actions` is
  `[player-emberling, opponent-aquafin]`, the `move-used` events follow the same
  order, and each action's snapshot shows the state after that action.
- With the opponent raised to Speed 100, both `turn.actions` and the events list
  the opponent first, and the history records `[start, opponent, player]`.

The assertions cover `turn.actions` (actor, Move, and target), the event order
and payloads, and the history entry order.

### Equal Speed

With both combatants at Speed 70, the tie follows the documented position in
the `Combat`, never the input order or randomness:

- In the default group order (`player`, `opponent`), the player acts first even
  when the declarations arrive in the opposite order.
- With the groups reversed (`opponent`, `player`), the opponent acts first.
- Seeds 7 and 99 produce the same actor order, so the tie does not depend on the
  random state.
- Two resolutions from the same starting snapshot produce identical combat,
  events, and history primitives, and the input snapshot is not mutated.

### Knockout in the first action

Two directional knockout scenarios use the real completion rule:

- The player is faster and `opponent-aquafin` starts at 15 HP. `ember-burst`
  deals 15 and leaves it at 0 HP.
- The opponent is faster (Speed 100) and `player-emberling` starts at 42 HP.
  `aqua-burst` deals 45 and leaves it at 0 HP.

In both cases:

- `resolution.combat.status` is `completed`.
- `resolution.outcome` is a victory with the correct `winnerGroupId`
  (`player` in the first case, `opponent` in the second).
- `turn.actions` has one entry, the history is `[start, action]`, and the events
  are only the completing `move-used` plus `combat-completed`.
- The final snapshot, including `RandomPocket`, equals the successor of the
  completing action.

A counterfactual control keeps the same seed, content, rules, and first action
but starts the opponent at 16 HP, so the first hit does not complete the combat.
That control resolves the second action, emits the opponent's `move-used`, and
advances the `RandomPocket`. The first action's random state is identical in
both runs and the final states differ, so the missing event and RNG draw after
the knockout are a real guarantee, not a coincidence.

#### Move PP limitation

Phase 1 does not model Move PP: the product combat has no `movePp` attribute,
and #125 lists PP consumption as out of scope for this slice. The product test
therefore verifies the "no second action" criterion through its observable
effects: no action, no event, no history entry, no randomness draw, and an
unchanged snapshot. The PP invariant itself is covered at the unit level by
`duelmon-combat-turn.test.ts`, which decreases `movePp` in its recording
resolver. This is a documented Phase 1 limitation, not a gap in #123–#127, and
it did not require a production change.

### Missing or invalid declarations

Every rejection returns `Either.left`, produces no resolution, and leaves the
combat and `RandomPocket` byte-for-byte unchanged.

| Scenario | Expected failures |
| --- | --- |
| Empty declaration list | Length failure plus one missing declaration per group |
| One declaration only | Length failure plus the missing opposing group |
| The same actor declared twice | Duplicate actor at `declarations.1.input.actorId` plus the missing opposing group |
| Move absent from the catalog | `invalid-input` at `declarations.0.input.moveId` plus the missing player group |
| Catalog Move the creature does not know | `rejected` at `declarations.0.input.moveId` plus the missing player group |
| Actor targeted as itself | `invalid-target` at `declarations.0.input.target.id` plus the missing player group |

The tests assert the exact `reason`, `path`, and message of each failure. Because
the turn returns no result on failure, there is no action, event, or history
entry that could contain a partial resolution.

### History order

A normal turn records:

```text
[start, action(player-emberling), action(opponent-aquafin)]
```

The test asserts that:

- Each action entry carries its actor, Move, and target.
- The entry order equals `turn.actions` and the `move-used` event order.
- Each entry snapshot equals the successor snapshot of the same action.
- The first snapshot shows opponent HP 89/104; the second shows player HP 57/99
  and opponent HP 89/104, so the history reflects the state after every action.
- The action text names the actor, Move, and target, and explains the order with
  both Speeds: `(Speed 70 > 48)` for the first action and `(Speed 48 < 70)` for
  the second. Each entry also carries `speed` and `tieBreak`, so the order is
  explainable from the history alone.
- The report text inside the entry renders the same HP values as the snapshot.
- The history primitives round-trip through `DuelmonCombatHistory.fromPrimitives`.
- A knockout turn records only `[start, action]` for the completing action.

### Order from the history alone

`lets a reader explain the order from the history alone` reads only the recorded
entries. Each entry exposes the actor Speed (`70` and `48`) and `tieBreak:
false`, and the text contains both Speeds and their relation. The equal-Speed
case (`explains an equal-Speed tie from the history alone`) exposes `70` for both
actions with `tieBreak: true` and the text
`(Speed 70 = 70, fixed combat order)`, so a reader can explain the order without
reading internal docs or the implementation.

### No priority, stat stages, or random ties

The order depends only on the raw `speed` battle attribute:

- Declaring `ember-burst`/`aqua-burst`, `tackle`/`aqua-burst`, or
  `tackle`/`tackle` produces the same actor order.
- Every Phase 1 Move in the fixture has priority 0, and the start contract
  rejects non-zero priority content.
- Adding `speedStage: -6` to the player and `speedStage: +6` to the opponent does
  not change the order. If effective Speed were applied, the staged opponent
  would overtake the player; Phase 1 ignores the stage and keeps the raw order.
- The equal-Speed scenarios show that no `RandomPocket` draw breaks the tie.

Priority, effective Speed, paralysis, and random tie-breaks are Phase 2 work and
are intentionally absent from this matrix.

## Criterion → test matrix

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Different Speed: the fastest acts first | `resolves the faster player first and reflects the state after each action`; `resolves the faster opponent first when the opponent has the higher Speed` | Pass |
| Equal Speed: the documented fixed order applies | `breaks equal Speed by the documented combat order regardless of the declaration order` | Pass |
| Equal Speed: the tie is reproducible and not random | `keeps the equal-Speed order across different random seeds`; `is reproducible from the same starting point without mutating the combat` | Pass |
| Knockout in the first action: the second action is not resolved | `stops after the faster player knocks the opponent out in the first action`; `does not resolve or draw randomness for the omitted action after the knockout`; `stops after the faster opponent knocks the player out in the first action` | Pass |
| Knockout keeps the completed combat, outcome, and winner | `stops after the faster player knocks the opponent out in the first action`; `stops after the faster opponent knocks the player out in the first action` | Pass |
| Missing or invalid declaration is rejected without resolving | `rejects an absent declaration list without resolving or changing the combat`; `rejects a missing declaration without resolving or changing the combat`; `rejects a duplicated declaration without resolving or changing the combat`; `rejects an unknown or unknown-to-the-creature Move without resolving`; `rejects an invalid target without resolving or changing the combat` | Pass |
| The order is recorded in the history | `records the real order, identity, and successor snapshot of every action` | Pass |
| A reader can explain the order from the history alone | `lets a reader explain the order from the history alone`; `explains an equal-Speed tie from the history alone` | Pass |
| No priority, stat stages, or random tie-breaks | `does not depend on the declared Move or on speed stages`; `keeps the equal-Speed order across different random seeds`; `is reproducible from the same starting point without mutating the combat` | Pass |
| The state is updated after every action | `resolves the faster player first and reflects the state after each action`; `records the real order, identity, and successor snapshot of every action` | Pass |
| Results documented | This document | Pass |

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/integration/turn-order-product.test.ts --conditions=development` | 15 pass, 0 fail, 148 expect() calls, 1 file |
| `bun test plugins/duelmon --conditions=development` | 324 pass, 0 fail, 1226 expect() calls, 34 files |
| `bun run test` | 571 pass, 0 fail, 2846 expect() calls, 62 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass, no findings |

## Findings and limitations

- No production gap was found in #123–#127; the suite is green against the
  current contracts and no production file changed.
- Phase 1 does not track Move PP, so the product test substitutes the observable
  guarantees (no action, event, history entry, or randomness draw) for the PP
  decrement. This is the Phase 1 scope recorded in #125, not a missing contract.
- The exact damage and HP values are pinned by seed 42 and the real Gen 1 damage
  slice. A future damage-formula change updates these expectations on purpose.
- `speedStage` is injected as an extra battle attribute over the started combat
  only to prove that Phase 1 ignores it. It is not produced by the Phase 1 start
  contract.

## Acceptance criteria

- [x] Different Speed: the faster combatant acts first.
- [x] Equal Speed: the documented fixed order applies.
- [x] Knockout in the first action: the second action is not resolved.
- [x] A missing or invalid declaration is rejected.
- [x] The order is recorded in the history.
- [x] The results are documented.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #128 — Probar velocidad distinta, velocidad igual y debilitamiento en la primera acción.
- [Phase 1 speed order](./123-speed-order.md).
- [Phase 1 turn declarations](./124-turn-declarations.md).
- [Phase 1 turn resolution](./125-resolve-order.md).
- [Stopping the turn after the combat completes](./126-stop-after-completion.md).
- [Recording the turn order in the history](./127-order-history.md).
- [Start product tests](./89-start-product-tests.md).
- [Declaration product tests](./111-declaration-product-tests.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
