# Initial state display

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #83 — Empezar un combate uno contra uno
> Task: #87 — Mostrar el estado inicial en la pantalla mínima o registro

## Scope and privacy

This document is internal to the Duelmon plugin. It defines how the initial
combat state is projected for the minimal Phase 1 screen and the basic history.
It does not define combat rules, engine behavior, turn resolution, or public
APIs.

The state comes from the private, locally generated Gen 1 dataset produced by
`@pocket-forge/duelmon-dataset`. That dataset is never committed or distributed.
The report only renders the neutral identifiers, types, HP, and moves embedded
in the `Combat` snapshot; it never reads the dataset.

## Single source of truth

The screen and the history read the same `Combat` snapshot used by battle
resolution. They do not keep a manual copy of the state:

```text
DuelmonCombatStart.fromContent(...) -> Combat
Combat -> DuelmonCombat -> DuelmonCombatantGroup -> DuelmonCombatant
Combat -> DuelmonCombatReport -> readable lines
```

The semantic views are read-only projections. The `Combat` and its primitives
remain the state and the serialization format. The report wraps the views and
recomputes its lines on demand.

## Semantic views

`DuelmonCombat`:

- `id`.
- `groups()`: groups in combat order.
- `group(id)`: one group or `undefined`.

`DuelmonCombatantGroup`:

- `id`.
- `activeCombatantIds`: the active subset.
- `activeCombatants()`: active combatants in group order.
- `combatants()`: every combatant in group order.
- `combatant(id)`: one combatant or `undefined`.

`DuelmonCombatant` and `DuelmonMove` already expose HP, types, and move details
from #97. The screen never accesses `attributes` directly.

## Report format

`DuelmonCombatReport.fromCombat(combat)` renders the initial state as text:

```text
Combat "demo-1"

Group "player" (active: player-charmander)
  * player-charmander (charmander) [Fire] HP 99/99
      - tackle (Normal / Physical / 40 power)
      - scratch (Normal / Physical / 40 power)

Group "opponent" (active: opponent-squirtle)
  * opponent-squirtle (squirtle) [Water] HP 104/104
      - watergun (Water / Special / 40 power)
      - tackle (Normal / Physical / 40 power)
```

- `*` marks the active combatant.
- The group header repeats the active subset.
- HP is current and maximum.
- Types come from the embedded species snapshot.
- Moves come from the embedded creature snapshot.

## What is shown and what is not

Shown:

- Current and maximum HP.
- Active combatant of each group.
- Species types.
- Loadout moves with type, category, and power.

Not shown, because it is outside Phase 1:

- PP, accuracy, and priority.
- Status conditions, stat stages, and secondary effects.
- Attack, defense, special, and speed.
- Random state and combat lifecycle status.
- Display names from the private dataset.

## Handoff to later tasks

### Record the start (#88)

Record the initial state in the basic history as the serialized `Combat`
primitives plus the readable report text. Do not rebuild a separate summary by
hand.

### Product tests (#89)

Use the fixed starting point from
[the initial battle state](./85-initial-battle-state.md) and assert that the
report shows HP, active combatants, types, and moves, and that it omits
information outside Phase 1.

## Acceptance criteria

- [x] The display shows current and maximum HP, the active combatant, and the
      moves.
- [x] The display reads the same `Combat` snapshot used by resolution.
- [x] No information outside Phase 1 is shown.
- [x] The initial state is readable without knowing the implementation.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
- User story #83 — Empezar un combate uno contra uno.
- Task #85 — [Definir el estado inicial de la batalla](./85-initial-battle-state.md).
- Task #97 — Añadir vistas semánticas de dominio en el plugin de Duelmon.
- Task #88 — Registrar el inicio en el historial básico.
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
