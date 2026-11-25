# Start history

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #83 — Empezar un combate uno contra uno
> Task: #88 — Registrar el inicio en el historial básico

## Scope and privacy

This document is internal to the Duelmon plugin. It defines how the start of a
Phase 1 combat is recorded in the basic history: the entry shape, its readable
text, and its serialization contract. It does not define combat rules, turn
resolution, persistence, or public APIs.

The history is built from the same `Combat` snapshot the start and the screen
use. It never reads the private, locally generated Gen 1 dataset produced by
`@pocket-forge/duelmon-dataset`, and it never keeps a hand-built summary of the
state.

## Single source of truth

```text
DuelmonCombatStart.fromContent(...) -> Combat
Combat -> DuelmonCombatReport -> readable text
Combat -> Combat.toPrimitives() -> serialized snapshot
Combat -> DuelmonCombatHistory.start(combat) -> start entry
```

`DuelmonCombatHistory.start(combat)` creates the history with one start entry.
The entry is built from the received `Combat`:

- its snapshot is `combat.toPrimitives()`;
- its text is `DuelmonCombatReport.fromCombat(combat).toString()`.

Both values are produced in the same construction, so the entry cannot
contradict the screen or the state shown. The semantic views remain read-only
projections and are not part of the serialization.

## Entry format

```ts
interface DuelmonCombatHistoryEntryPrimitives {
  readonly combat: CombatPrimitives;
  readonly kind: 'start';
  readonly text: string;
}

interface DuelmonCombatHistoryPrimitives {
  readonly entries: readonly DuelmonCombatHistoryEntryPrimitives[];
}
```

| Field | Meaning |
| --- | --- |
| `combat` | Canonical `Combat.toPrimitives()` snapshot of the recorded moment. |
| `kind` | Recorded event. Phase 1 only has `start`. |
| `text` | Readable report text for the same snapshot. |

`DuelmonCombatHistoryEntry` exposes `kind`, `text`, and a detached `combat`
snapshot. `DuelmonCombatHistory` exposes `entries()` in record order and
serializes through `toPrimitives()`. Both classes hydrate from primitives
without recording a new event.

The history is deterministic: the same starting point produces the same
primitives. Entry snapshots and returned copies are detached, so mutating a
consumer's object never changes the recorded entry.

## Readable text

The start entry reuses the report format from
[the initial state display](./87-initial-state-display.md):

```text
Combat "combat-1"

Group "player" (active: player-emberling)
  * player-emberling (emberling) [Fire] HP 99/99
      - ember-burst (Fire / Special / 40 power)
      - tackle (Normal / Physical / 35 power)

Group "opponent" (active: opponent-aquafin)
  * opponent-aquafin (aquafin) [Water] HP 104/104
      - tackle (Normal / Physical / 35 power)
```

The entry text shows the active combatant of each group, current and maximum
HP, species types, and loadout moves. It does not show PP, accuracy, priority,
status conditions, stat stages, raw battle stats, the random state, or the
combat lifecycle status.

## Acceptance criteria

- [x] The history includes a start entry.
- [x] The entry reflects the real initial state through
      `Combat.toPrimitives()`.
- [x] The entry is readable and does not expose internal details.
- [x] The history does not contradict the screen or the state shown.

## Handoff to later tasks

### Product tests (#89)

Record the start from the `Combat` returned by `DuelmonCombatStart` and assert
that the history contains one `start` entry whose snapshot equals
`combat.toPrimitives()` and whose text matches `DuelmonCombatReport`.

### Basic combat log

Later entries extend the `kind` union and append to the same history. Turn,
damage, faint, and outcome entries keep the same rule: build from the state the
resolution produced and reuse the readable projection instead of rebuilding a
summary by hand.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #83 — Empezar un combate uno contra uno.
- Task #85 — [Definir el estado inicial de la batalla](./85-initial-battle-state.md).
- Task #87 — [Mostrar el estado inicial en la pantalla mínima o registro](./87-initial-state-display.md).
- Task #88 — Registrar el inicio en el historial básico.
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
