# Stopping the turn after the combat completes

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #126 — Detener la segunda acción si la primera termina la batalla
> Blocked by: #125. Unblocks: #127, #128.

## Scope and privacy

This document is internal to the Duelmon plugin. It records how a Phase 1 turn
stops at the action that ends the battle, how a turn over an already completed
combat is rejected, and which invariants the returned resolution guarantees.

It does not register history (#127) or define the product test matrix of the
story (#128). It also does not change the Phase 1 speed order (#123), the
declaration contract (#124), or the basic turn resolution (#125).

## Contract

`DuelmonCombatTurn.resolve(combat, declarations)` keeps the
`Either<CombatEngineFailure[], DuelmonCombatTurnResult>` signature and adds two
explicit boundaries. The `resolution` field of the result keeps the single
`CombatResolution` the turn produces.

### 1. No turn starts after the end

The first check rejects a combat that is not `active`, before any declaration is
parsed or validated:

```ts
function receiveTurn(combat: Combat, declarations: unknown) {
  if (combat.status !== 'active') {
    return Either.left([
      new CombatEngineError('combat-not-active', 'Only an active combat can resolve a turn', 'status'),
    ]);
  }

  return DuelmonTurnDeclarations.receive(catalog, combat, declarations);
}
```

The guard runs before `DuelmonTurnDeclarations.receive`, so an invalid or empty
declaration set over a completed combat still returns `combat-not-active`, never
an input failure. No action is resolved, no event is emitted, and neither PP nor
`RandomPocket` is touched.

### 2. The turn stops at the completing action

After every action the service inspects the engine resolution:

```ts
function resolveDeclaredActions(ordered: readonly DuelmonTurnDeclaration[], engine: CombatEngine) {
  let outcome: CombatOutcome | undefined;

  for (const declaration of ordered) {
    const resolved = engine.resolve(current, actionInput(declaration)).getRight();

    current = resolved.combat;

    if (resolved.outcome) {
      if (resolved.combat.status !== 'completed') {
        return Either.left([/* invalid-outcome */]);
      }

      outcome = resolved.outcome;

      break;
    }

    if (resolved.combat.status !== 'active') {
      return Either.left([/* invalid-outcome */]);
    }
  }

  return Either.right(outcome);
}
```

- A victory or draw outcome with the `completed` successor stops the loop. The
  remaining declarations are never passed to the engine.
- A completed successor without an outcome, or an outcome with an active
  successor, is an engine invariant violation. The service returns
  `CombatEngineError('invalid-outcome', ...)` instead of an inconsistent
  resolution. The real engine cannot produce either state; the guards keep the
  turn contract explicit if a future engine change breaks it.

The `resolution` field is still one `CombatResolution.create(finalCombat, events,
outcome)`. Because the turn stops at the completing action, `finalCombat` is the
exact completed successor returned by the engine, and `outcome` is the exact
`CombatOutcome` the engine reached, including `winnerGroupId` for a victory.

## Invariants

1. **One stop boundary.** The first action that completes the combat ends the
   turn. Later declarations are not resolved, even when the surviving side could
   still act.
2. **Outcome and winner are preserved.** The resolution keeps the engine
   `CombatOutcome` object and its `winnerGroupId`; the service never rebuilds or
   normalizes them.
3. **The completed snapshot is preserved.** The resolution combat is the
   `completed` successor of the completing action, including its advanced
   `RandomPocket`.
4. **The omitted action leaves no trace.** It emits no event (no `move-used`,
   `move-missed`, `attribute-modified`, or `combat-completed` of its own), does
   not consume PP, and draws no randomness. The guarantee is structural: the
   engine is not called for it.
5. **Events are only the resolved actions plus completion.** The merged sequence
   is continuous from 1 to `n` and ends with the completing action's
   `combat-completed`.
6. **No action is accepted after the end.** A turn over a `completed` combat is
   rejected with `combat-not-active` and resolves nothing.

The #125 "still standing" rule remains in place and is different from the stop
boundary: an actor that is already fainted is skipped, but a turn only stops
early when an action **completes the combat** (that is, a completion rule returns
an outcome). Skipping a fainted actor without a completion rule still lets the
other declaration resolve.

## History boundary (#127)

The turn returns only the events of the actions it actually resolved.
`DuelmonCombatHistory.recordTurn` builds the action history entries from those
resolved actions. An omitted declaration never reaches the engine, so it cannot
produce an event, an action, or a history entry. This document does not add
history entries; it records the invariant the history consumes.

## Tests

The behaviour is covered by:

- [`plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts)
  with a recording resolver stub that also decreases `movePp`, the real
  `CombatEngine`, and `DuelmonCombatMother.hpCompletionRule()`.
- [`plugins/duelmon/tests/integration/turn-resolution.test.ts`](../../plugins/duelmon/tests/integration/turn-resolution.test.ts)
  with the real `DuelmonCombatPlugin`, the real action bindings, the composition
  rule, the real `hp <= 0` completion rule, and `Gen1UseMoveMechanics`.

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| The end of the battle is detected after the first action | `stops the turn after the first action completes the combat`; `stops after the first action without resolving, emitting events for, or drawing randomness for the second` | Pass |
| The second action is not resolved | `stops the turn after the first action completes the combat` (the stub records one call); `stops after the first action without resolving, emitting events for, or drawing randomness for the second` (the final snapshot equals the first action's) | Pass |
| The result and winner are preserved | `stops the turn after the first action completes the combat`; `stops after the first action without resolving, emitting events for, or drawing randomness for the second` (outcome, `winnerGroupId`, and completed combat) | Pass |
| The history does not record a second action that did not happen | `stops the turn after the first action completes the combat` (no event from the omitted actor); `stops after the first action without resolving, emitting events for, or drawing randomness for the second` (events are only the first action plus `combat-completed`) | Pass |
| No action is accepted after the end | `rejects a turn over a combat that already completed without resolving anything`; `does not validate declarations after the combat completed`; `rejects a turn over a completed combat without resolving or drawing randomness` | Pass |
| An inconsistent engine result is rejected | `rejects a completed combat that the engine returned without an outcome`; `rejects an engine outcome that did not complete the combat` | Pass |
| A fainted actor is still skipped (#125) | `skips an actor that is no longer standing when its action comes up` | Pass |

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon --conditions=development` | 289 pass, 0 fail, 1011 expect() calls, 32 files |
| `bun run test` | 536 pass, 0 fail, 2631 expect() calls, 60 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

## Acceptance criteria

- [x] The end of the battle is detected after the first action.
- [x] The second action is not resolved.
- [x] The result and winner are preserved.
- [x] The history does not record a second action that did not happen.
- [x] No actions are accepted after the end.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #126 — Detener la segunda acción si la primera termina la batalla.
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md) — Q15 and Q17.
- [Phase 1 turn resolution](./125-resolve-order.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
