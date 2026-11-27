# Start product tests

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #83 — Empezar un combate uno contra uno
> Task: #89 — Probar el inicio: contenido válido, incompleto e inválido

## Scope and privacy

This document is internal to the Duelmon plugin. It records the product tests
for the Phase 1 combat start: valid content, incomplete content, invalid content,
the exposed state surface, and the start entry in the history. It does not define
combat rules, turn resolution, persistence, or public APIs.

The tests consume the private, locally generated Gen 1 dataset through the
fixture catalog. Neither the dataset nor its extracted rows are committed or
distributed. The tests read neutral identifiers, types, HP, and moves embedded in
the `Combat` snapshot.

## Fixture

The fixed starting point is the one exposed by `DuelmonCombatStartMother`, the
same fixture used by the start, display, and history tasks. It matches the values
fixed in [the initial battle state](./85-initial-battle-state.md): level 50, seed
42, the same HP totals, and the same identifiers.

| Field | Value |
| --- | --- |
| Combat id | `combat-1` |
| Groups | `player`, `opponent` |
| Active combatants | `player-emberling`, `opponent-aquafin` |
| Player creature | `emberling`, Fire, HP 99/99, moves `ember-burst`, `tackle` |
| Opponent creature | `aquafin`, Water, HP 104/104, moves `aqua-burst`, `tackle` |
| Random state | `{ seed: 42, state: 42 }` |

The tests read the state through `DuelmonCombat`, `DuelmonCombatantGroup`, and
`DuelmonCombatant`. They do not read the raw `attributes` map to obtain the
state.

## Product scenarios

The product tests live in
[`plugins/duelmon/tests/integration/combat-start.test.ts`](../../plugins/duelmon/tests/integration/combat-start.test.ts).

### Valid content

`DuelmonCombatStart.fromContent` receives the fixed starting point and returns a
`Combat` with two groups and one active combatant per group. The semantic views
expose the active combatant, current and maximum HP, species types, and loadout
moves for both creatures.

### Incomplete content

An unknown move reference is rejected with `reason: 'unknown-move'` and a message
that names the missing move. An empty loadout is rejected with
`reason: 'missing-moves'`. Both failures return `Either.left` with the aggregated
errors, never a partial combat.

### Invalid content

Moves outside the Phase 1 slice are rejected before any `Combat` is built:

- `oath` is a Status move.
- `flare` has a secondary effect.
- `quick-jab` has non-zero priority.
- A synthetic move with a `charge` flag.

Each rejection uses `reason: 'unsupported-move'`, reports the move path, and
explains why the move is outside Phase 1. The flag case lives in the content
start tests because it needs a catalog entry outside the shared fixture.

### Phase 1 state surface

For the started combat, the semantic combatant projection exposes exactly the
Phase 1 battle attributes: `attack`, `defense`, `hp`, `level`, `maxHp`,
`special`, and `speed`. It does not expose `status`, `movePp`, stat stages, or
other out-of-phase battle state.

Every started move is damaging, always hits, has zero priority, has no
primary status, volatile status, secondary effect, stat-stage change, drain,
recoil, multi-hit behavior, or high critical-hit ratio, and carries no
turn-changing flag.

The readable report and the history text omit PP, accuracy, priority, status,
seed, and raw battle stats.

### Start history

`DuelmonCombatHistory.start(combat)` records one `start` entry. Its snapshot is
`combat.toPrimitives()` and its text is
`DuelmonCombatReport.fromCombat(combat).toString()`, so the history cannot
contradict the started state.

## Results

Executed on 2026-11-25:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/integration/combat-start.test.ts --conditions=development` | 8 pass, 0 fail, 124 expect() calls |
| `bun test plugins/duelmon --conditions=development` | 204 pass, 0 fail, 701 expect() calls, 24 files |
| `bun run typecheck` | Pass |
| `bun run lint:fix` | Pass, no findings |

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Valid start with two creatures from the minimum set | `starts a valid one-on-one combat with two minimum-set creatures` | Pass |
| Incomplete content rejected with a clear message | `rejects incomplete content with a clear message and no combat` and `rejects a loadout without moves` | Pass |
| Invalid content rejected without a partial combat | `rejects out-of-phase content without a partial combat` | Pass |
| No functions outside Phase 1 are exposed | `exposes only the Phase 1 state surface` and `does not expose information outside Phase 1 in the readable text` | Pass |
| The history records the start | `records the start in the history from the same combat` | Pass |
| Minimum set has three creatures, five simple moves, physical and special coverage, and an affinity case | `Phase 1 minimum content set` tests in `duelmon-combat-start.content.test.ts` | Pass |
| Results documented | This document | Pass |

## Acceptance criteria

- [x] The valid start is covered with two creatures from the minimum set.
- [x] Incomplete content is rejected with a clear message.
- [x] Invalid content is rejected without creating a partial combat.
- [x] The exposed state does not contain functions outside Phase 1.
- [x] The history records the start.
- [x] The results are documented.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #83 — Empezar un combate uno contra uno.
- Task #84 — [Phase 1 minimum content set](./82-phase-1-minimum-content.md).
- Task #85 — [Definir el estado inicial de la batalla](./85-initial-battle-state.md).
- Task #86 — Construir el inicio de la batalla desde el contenido.
- Task #87 — [Mostrar el estado inicial en la pantalla mínima o registro](./87-initial-state-display.md).
- Task #88 — [Registrar el inicio en el historial básico](./88-start-history.md).
- Task #97 — Añadir vistas semánticas de dominio en el plugin de Duelmon.
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
