# Phase 1 speed order

> Epic: #82 — Esqueleto de una batalla Gen 1
> Parent story: #122
> Task: #123 — Definir la comparación de velocidad y el orden fijo para empates de la Fase 1
> Unblocks: #124, #125

## Scope and privacy

This document is internal to the Duelmon plugin. It defines how a Phase 1 turn
orders the combatants that declare an action: the Speed comparison and the fixed
order that applies when two active combatants have the same Speed.

It does not resolve a turn, receive the two declarations, keep history, or stop
after a knockout. Those belong to #124–#128. It does not define priority, stat
stages, paralysis, or random tie-breaks; those are outside the Phase 1 slice.

## Decision

`DuelmonSpeedOrder` is a value object built from a `Combat` snapshot. It
provides a total, deterministic order over `DuelmonCombatant` views:

1. the higher Speed goes first;
2. equal Speed is broken by the combatant position in the `Combat`, lower
   position first.

The order does not depend on the array passed to `sort`: the same combatants
always produce the same sequence.

## Speed source

The comparison always reads `DuelmonCombatant.speed`, which reads the `speed`
battle attribute from the combatant attribute map. The catalog declaration,
the species base stats, and any parallel copy are never used. The Speed read is
the neutral battle state produced by `DuelmonCombatStart`, so a transition that
changes `speed` changes the next order.

## Fixed tie order

The combatant position is the zero-based index obtained by walking the `Combat`
in its own order:

- groups in `Combat.groups` order, which is the order of `DuelmonCombat.groups()`;
- combatants inside a group in `CombatantGroup.combatants` order, which is the
  order of `DuelmonCombatantGroup.combatants()`.

Composition order is stable during a battle: switching changes the active
subset attribute, not the group or the combatants inside it. Reserves receive a
position too, so the same order can compare any combatant of the combat; Phase 1
only orders the combatants that declare an action.

| Combat | Group order | Active combatants | Speed | Phase 1 order |
| --- | --- | --- | --- | --- |
| default fixture | `player`, `opponent` | `player-emberling`, `opponent-aquafin` | 70, 48 | `player-emberling`, `opponent-aquafin` |
| equal Speed | `player`, `opponent` | `player-emberling`, `opponent-aquafin` | 70, 70 | `player-emberling`, `opponent-aquafin` |
| equal Speed, groups reversed | `opponent`, `player` | `opponent-aquafin`, `player-emberling` | 70, 70 | `opponent-aquafin`, `player-emberling` |

The last two rows show that the tie is decided by the documented position, not
by the combatant identifier or by the order in which callers list the values.

## What is not applied

Phase 1 compares the raw Speed attribute only. The order never reads or applies:

- Move priority;
- `speedStage` stat stages;
- paralysis or any other status condition;
- `RandomPocket`, or any other source of randomness.

A combatant with `speedStage: 6` and Speed 50 still loses to a combatant with
`speedStage: -6` and Speed 60, and a paralyzed combatant keeps its raw Speed
for both the comparison and the tie rule.

## Why Phase 1

The roadmap ([Q15](../grill/0003-combat-plugin-roadmap.md)) reserves priority
and random tie-breaks for Phase 2: the Phase 2 turn service orders by priority
and effective Speed, and draws from `RandomPocket` for ties. Phase 1 needs a
stable, replayable baseline before that layer exists. Reading the raw battle
Speed and falling back to a documented composition position gives #124 and #125
an order that is reproducible from the same starting point and free of
hidden state. The deterministic tie is a Phase 1 rule; Phase 2 may replace it
with the roadmap's random tie once priority and effective Speed land.

## API

```ts
const order = DuelmonSpeedOrder.fromCombat(combat);
const [first, second] = order.sort([opponent, player]);
```

- `DuelmonSpeedOrder.fromCombat(combat)` captures the combatant positions once.
  `DuelmonCombatTurn` builds it once per turn and reuses it for the two
  declarations.
- `compare(left, right)` returns a negative number when `left` goes first, a
  positive number when `right` goes first, and zero for the same combatant.
- `sort(combatants)` returns a new frozen array with the fastest combatant
  first. The input array is never mutated.

Both `compare` and `sort` throw `InvalidArgumentError` when a combatant does not
belong to the combat that defines the order. Comparing combatants from a
different combat is a programmer error, not a silent fallback.

## Tests

The behaviour is covered by
[`plugins/duelmon/tests/domain/turn/duelmon-speed-order.test.ts`](../../plugins/duelmon/tests/domain/turn/duelmon-speed-order.test.ts)
with the `DuelmonCombatMother.speedOrderCombat` fixture.

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon/tests/domain/turn/duelmon-speed-order.test.ts --conditions=development` | 11 pass, 0 fail, 21 expect() calls |
| `bun test plugins/duelmon --conditions=development` | 246 pass, 0 fail, 852 expect() calls, 29 files |
| `bun run test` | 493 pass, 0 fail, 2472 expect() calls, 57 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |

| Acceptance criterion | Test | Result |
| --- | --- | --- |
| Speed is read from the battle state | `reads Speed from the combatant battle attributes`; `ignores speed stages ...`; `ignores paralysis ...` | Pass |
| The fastest combatant is identified deterministically | `puts the faster combatant first ...`; `puts the faster opponent first ...` | Pass |
| A documented fixed order exists for equal Speed | `breaks equal speeds by the combatant position ...`; `follows the group order for equal speeds`; this document | Pass |
| The order is reproducible from the same starting point | `is reproducible from the same starting point without mutating the state` | Pass |
| Priority, stat stages, and paralysis are not applied | `ignores speed stages ...`; `ignores paralysis ...`; `uses the documented tie order even when a combatant is paralyzed` | Pass |

## Acceptance criteria

- [x] Speed is read from the battle state.
- [x] The fastest combatant is identified deterministically.
- [x] A fixed order for equal Speed is documented.
- [x] The order is reproducible from the same starting point.
- [x] Priority, stat stages, and paralysis are not applied.
- [x] Randomness is not consumed.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- Parent story #122.
- Task #123 — Definir la comparación de velocidad y el orden fijo para empates de la Fase 1.
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md) — Q15.
- [Turn declaration](./106-turn-declaration.md).
- [Turn declaration boundary](./118-turn-declaration-boundary.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
