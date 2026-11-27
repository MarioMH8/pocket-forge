# Phase 1 turn order gaps

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #129 — Cerrar los huecos detectados en la verificación del orden por velocidad
> Blocked by: #123–#128

## Scope and privacy

This document is internal to the Duelmon plugin. It records the four gaps an
independent review found in the delivered Phase 1 turn order (#123–#128) and how
this task closes them.

It does not change the speed-order rule, the declaration rules, the stop-after-
completion contract, the event contract, or the neutral packages. The only
production behaviour changes are the order information exposed by a resolved
action and the Phase 1 move-support check at the turn boundary.

| Gap | Closed by |
| --- | --- |
| H1 — the player cannot explain the order from the product | Action and history entries expose `speed` and `tieBreak`, and the readable history text explains the order with both Speeds or the fixed tie. |
| H2 — a Move outside Phase 1 is accepted at the turn level | `DuelmonTurnDeclarations.receive` applies `Phase1MoveConstraints` and rejects with `rejected` on `input.moveId`. |
| H3 — documentation and comments are stale | The #123–#128 documents, the README, `CONTEXT.md`, and the integration comment describe the final contracts. |
| H4 — edge cases are not covered | New declaration, draw, zero-HP-without-completion, and repeated `recordTurn` tests. |

## H1 — Order information in the product

`DuelmonCombatTurnAction` now carries:

```ts
interface DuelmonCombatTurnAction {
  readonly actorId: string;
  readonly combat: Combat;
  readonly moveId: string;
  readonly speed: number;
  readonly targetId: string;
  readonly tieBreak: boolean;
}
```

- `speed` is read from the combat snapshot the turn used to order the actions,
  not from the declaration or the catalog.
- `tieBreak` is `true` when the fixed combat order decided an equal-Speed tie.
  With the strict one-versus-one turn, both actions of a tie expose `true`.

The history action primitives carry the same information:

```ts
interface DuelmonCombatHistoryActionPrimitives {
  readonly actorId: string;
  readonly moveId: string;
  readonly speed: number;
  readonly targetId: string;
  readonly tieBreak: boolean;
}
```

The action line in the readable entry explains the position instead of only
naming the action:

```text
player-emberling acted first with ember-burst on opponent-aquafin (Speed 70 > 48)
opponent-aquafin acted second with aqua-burst on player-emberling (Speed 48 < 70)
player-emberling acted first with ember-burst on opponent-aquafin (Speed 70 = 70, fixed combat order)
```

Phase 1 actions do not modify Speed, so the successor snapshot keeps the same
Speed values the turn used to order the actions. The entry still reuses
`DuelmonCombatReport` for the snapshot; only the first line changed.

The `start` entry and its primitives are unchanged, and existing start
serialization hydrates without the action fields.

### Product test

`lets a reader explain the order from the history alone` reads only the recorded
entries, without consulting internal docs:

- The first action exposes `speed: 70` and `tieBreak: false`; the second exposes
  `speed: 48` and `tieBreak: false`.
- The text of both entries contains both Speeds and the relation
  `(Speed 70 > 48)` / `(Speed 48 < 70)`.

`explains an equal-Speed tie from the history alone` records a 70/70 turn:

- Both actions expose `speed: 70` and `tieBreak: true`.
- Both texts contain `(Speed 70 = 70, fixed combat order)`.

## H2 — Phase 1 move support at the turn boundary

`DuelmonTurnDeclaration.validate` still checks only catalog, ownership, and
target. The plugin still applies that validation to `useMove` declarations.
Neither applies the Phase 1 content policy, so the generic engine can still
exercise Status, accuracy, and effect behaviour through the plugin.

`DuelmonTurnDeclarations.receive` now applies
`Phase1MoveConstraints.unsupportedReason` after the declaration is valid:

```ts
const unsupportedReason = Phase1MoveConstraints.unsupportedReason(declaration.move);

if (unsupportedReason !== undefined) {
  errors.push(new CombatResolutionErrorEntity('rejected', unsupportedReason, `${path}.input.moveId`));
  continue;
}
```

Because `DuelmonCombatTurn.resolve` receives its declarations through the set,
the turn boundary and the turn service share the same rejection. A Status Move,
a non-zero priority Move, or any other unsupported content returns the policy
message at `declarations.<index>.input.moveId` with reason `rejected`, and no
engine call, event, or randomness draw happens.

### Tests

- `rejects a Status Move at the turn boundary with the Phase 1 policy` injects
  `oath` into the player creature and gets
  `Move "oath" is a Status move, which is outside Phase 1`.
- `rejects a non-zero priority Move at the turn boundary with the Phase 1 policy`
  injects `quick-jab` and gets
  `Move "quick-jab" has non-zero priority, which is outside Phase 1`.
- `still accepts a supported Move added to the creature loadout` keeps a valid
  Move accepted.
- `rejects a Status or non-zero priority Move at the turn boundary` covers
  `DuelmonCombatTurn.resolve` with the same snapshots and asserts the resolver
  is never called.

`plugins/duelmon/tests/domain/action/use-move/use-move.action.test.ts` remains
green: the plugin still reports its own category, accuracy, and effect failures
instead of the Phase 1 policy.

## H3 — Documentation and comments

- `docs/content/125-resolve-order.md` documents
  `Either<CombatEngineFailure[], DuelmonCombatTurnResult>` and the
  `resolution` + `actions` shape.
- `docs/content/123-speed-order.md` and
  `docs/content/126-stop-after-completion.md` no longer describe the turn service
  or the history as future work.
- `plugins/duelmon/tests/integration/turn-declaration.test.ts` no longer claims
  that Phase 1 has no declaration set or turn service.
- `plugins/duelmon/CONTEXT.md` describes the report as a projection of the
  initial state and every action snapshot, and the turn/history entries with
  their order information.
- `plugins/duelmon/README.md` describes the turn-boundary policy, the action
  fields, and the readable order explanation, and no longer suggests the policy
  belongs to generic action validation.
- The tests that asserted the old `used ...` text now assert the order
  explanation.

## H4 — Edge cases

| Case | Test | Result |
| --- | --- | --- |
| One group | `rejects a combat with a single group` | `incompatible-contract` at `combat.groups` |
| Zero active combatants | `rejects a group with no active combatant` | `incompatible-contract` at `combat.groups.0.attributes.activeCombatantIds` |
| Non-array list (object and string) | `rejects a declaration list that is not an array` | `invalid-input` at `declarations` |
| Three entries | `rejects a list with three declarations` | length failure for 3 plus the duplicate actor failure |
| Draw outcome without a winner | `keeps a draw outcome without a winner and stops the turn` | `completed`, `CombatOutcome.draw()`, one action, no second event |
| First action leaves the other at 0 HP without a completion rule | `skips the second action when the first leaves the other at zero HP without a completion rule` | one action, `active`, second omitted by `isStanding`, no event/entry |
| Second `recordTurn` on an existing history | `appends a second turn without duplicating or losing the previous entries` | `[start, p, o, p, o]`, previous entries unchanged |

The draw case uses the real `ThresholdCombatCompletionRule` with
`hp <= 50` and `threshold-group`; both combatants start at 40 HP, so the first
action completes the battle with a draw. The zero-HP case uses the real
composition and `useMove` without a completion rule, so the combat stays
`active` and the second declaration is skipped by the #125 guard rather than by
the #126 stop.

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon --conditions=development` | 340 pass, 0 fail, 1320 expect() calls, 34 files |
| `bun run test` | 587 pass, 0 fail, 2940 expect() calls, 62 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass, no findings |

## Acceptance criteria

- [x] A resolved action exposes the Speed used to order it and whether the fixed
  order decided the tie.
- [x] The history exposes the order information in the action entry and explains
  it in readable text with both Speeds or the fixed tie.
- [x] The history alone explains the order for different and equal Speed.
- [x] The `start` entry and its serialization stay compatible.
- [x] A Move outside Phase 1 is rejected at the turn boundary with `rejected` on
  `input.moveId` and the policy message.
- [x] `DuelmonCombatTurn.resolve` rejects the same unsupported content.
- [x] `DuelmonTurnDeclaration.validate` and the plugin keep their generic
  contracts, and `use-move.action.test.ts` stays green.
- [x] The stale docs, comments, README, and glossary describe the final
  contracts.
- [x] The H4 edge cases have real tests.
- [x] Results are documented.

## Risks and limitations

- Only Phase 1 actions are ordered. Because they do not modify Speed, reading the
  other Speed from the successor snapshot for the readable line is equivalent to
  reading it at ordering time. A later slice that changes Speed inside an action
  must revisit that assumption or store both Speeds in the action.
- The action primitives add two required fields. Start primitives and old start
  entries are unaffected; persisted action entries written before this task keep
  their stored text and hydrate without validation, but they will not expose the
  new fields.
- The Phase 1 policy stays at the turn boundary by design. Applying it in the
  declaration or the plugin would break the generic engine support that the
  `useMove` tests intentionally exercise.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #129 — Cerrar los huecos detectados en la verificación del orden por velocidad.
- [Phase 1 speed order](./123-speed-order.md).
- [Phase 1 turn declarations](./124-turn-declarations.md).
- [Phase 1 turn resolution](./125-resolve-order.md).
- [Stopping the turn after the combat completes](./126-stop-after-completion.md).
- [Recording the turn order in the history](./127-order-history.md).
- [Turn order product tests](./128-turn-order-product-tests.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
