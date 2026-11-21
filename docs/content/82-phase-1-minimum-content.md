# Phase 1 minimum content set

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #83 — Empezar un combate uno contra uno
> Task: #84 — Definir el conjunto mínimo de criaturas y movimientos de la Fase 1

## Scope and privacy

This document is internal to the Duelmon plugin. It defines the minimum content
needed to start a one-on-one battle in Phase 1; it does not define combat rules,
engine behavior, or public APIs. It lives under `docs/content/` as an internal
record for the epic; it is not part of the published documentation site.

The content comes from the private, locally generated Gen 1 dataset produced by
`@pocket-forge/duelmon-dataset`. That dataset is never committed or distributed.
Only the selected rows are reproduced here as internal metadata for traceability;
the full generated dataset is not included, committed, or redistributed.

This document does not modify the neutral core described in
[ADR-0001](../adr/0001-preserve-a-neutral-original-game-domain.md). Duelmon remains
a private consumer of the neutral Combat domain. The dataset display names below
are reproduced only for internal traceability; the public domain vocabulary stays
neutral (`Creature`, `Affinity`, and the neutral catalog entities).

## Minimum set

The set contains three creatures and five moves. It covers the Fire, Water, Grass,
Poison, Normal, and Flying types, at least one physical and one special move, and
several effectiveness cases.

### Creatures

| ID | Name | Types | HP | Atk | Def | spa | spd | Speed | baseSpecial |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `charmander` | Charmander | Fire | 39 | 52 | 43 | 50 | 50 | 65 | 50 |
| `squirtle` | Squirtle | Water | 44 | 48 | 65 | 50 | 50 | 43 | 50 |
| `bulbasaur` | Bulbasaur | Grass / Poison | 45 | 49 | 49 | 65 | 65 | 45 | 65 |

The generated dataset stores Special Attack (`spa`) and Special Defense (`spd`)
separately. `DuelmonCatalog` collapses them into a single `baseSpecial` attribute
and maps it from `spa`; `spd` is not used by the catalog. The table lists both for
traceability, but `baseSpecial` is the value the catalog exposes.

### Moves

| ID | Name | Type | Category | Power | Accuracy | PP | Target |
|---|---|---|---:|---:|---:|---:|---|
| `tackle` | Tackle | Normal | Physical | 40 | 100 | 35 | normal |
| `scratch` | Scratch | Normal | Physical | 40 | 100 | 35 | normal |
| `watergun` | Water Gun | Water | Special | 40 | 100 | 25 | normal |
| `vinewhip` | Vine Whip | Grass | Special | 45 | 100 | 25 | normal |
| `peck` | Peck | Flying | Physical | 35 | 100 | 35 | any |

None of the selected moves has a status condition, stat change, secondary effect,
volatile status, drain, recoil, multi-hit, or high critical-hit ratio. All have
priority 0 and accuracy 100.

### Loadouts

| Creature | Moves |
|---|---|
| Charmander | `tackle`, `scratch` |
| Squirtle | `watergun`, `tackle` |
| Bulbasaur | `vinewhip`, `peck` |

Loadouts are content choices for Phase 1. They are not learnsets and do not imply
progression rules.

## Effectiveness

Multipliers are computed against the generated Gen 1 type chart and expressed as
the final product for the defender's type combination. The table covers every
loadout move against every selected creature.

| Move | Charmander | Squirtle | Bulbasaur |
|---|---:|---:|---:|
| Water Gun | 2x | 0.5x | 0.5x |
| Vine Whip | 0.5x | 2x | 0.25x |
| Peck | 1x | 1x | 2x |
| Tackle | 1x | 1x | 1x |
| Scratch | 1x | 1x | 1x |

The set therefore demonstrates super-effective, not-very-effective, and neutral
damage. It does not include an immunity case: no Ghost creature is selected, even
though the type chart supports Normal against Ghost at 0x.

## Phase 1 demo

The demo uses Charmander against Squirtle:

1. Charmander is the active creature for the player.
2. Squirtle is the active creature for the opponent.
3. The initial state shows both creatures' HP, types, moves, and active creature.
4. Charmander uses Tackle; Tackle is neutral against Squirtle.
5. Squirtle uses Water Gun; Water Gun is super effective against Charmander.
6. The exchange repeats until one active creature's HP reaches 0. That is the
   Phase 1 end condition; no additional content is needed.

The epic's illustrative "Tackle against Ember" is adapted to "Tackle against Water
Gun" because no simple Fire move is selected. The effectiveness case is carried by
Water Gun against Charmander. A Fire move is deferred to a later phase.

## Exclusions

Phase 1 does not model:

- PP consumption; PP is metadata only.
- Accuracy below 100; all selected moves always hit.
- Priority; all selected moves have priority 0.
- Status conditions, stat changes, secondary effects, or volatile statuses.
- Residual damage, switching, or team changes.
- Critical hits, high critical-hit moves, multi-hit moves, drain, recoil, OHKO
  moves, fixed damage, or charge moves.
- Immunity cases; the type chart supports them, but no selected creature has a
  type that is immune to a selected move.

## Handoff to later tasks

### Initial state (#85)

Use the selected creature base stats and loadouts to build the initial state. The
state needs each creature's HP, types, moves, and the active creature. `baseSpecial`
comes from `spa`; `spd` is not part of the neutral catalog.

### Battle start (#86)

Build the battle from the selected content. Validate that every referenced creature
and move exists in the catalog and that each move satisfies the Phase 1 constraints.

### Product tests (#89)

Cover valid content (Charmander against Squirtle), incomplete content (a missing
move), and invalid content (a move with a status or secondary effect).

## Acceptance criteria

- [x] Two or three creatures with types: Charmander, Squirtle, Bulbasaur.
- [x] Four to six simple moves: Tackle, Scratch, Water Gun, Vine Whip, Peck.
- [x] At least one physical and one special move: Tackle, Scratch, and Peck are
      physical; Water Gun and Vine Whip are special.
- [x] At least two types and an effectiveness case: six types and 2x, 0.5x, and
      0.25x cases.
- [x] Documented and sufficient for the Phase 1 demo.

## References

- Epic #82 — Esqueleto de una batalla Gen 1.
- User story #83 — Empezar un combate uno contra uno.
- Task #84 — Definir el conjunto mínimo de criaturas y movimientos de la Fase 1.
- [Combat plugin roadmap](../grill/0003-combat-plugin-roadmap.md).
- [ADR-0001 — Preserve a neutral, original game domain](../adr/0001-preserve-a-neutral-original-game-domain.md).
- [Duelmon dataset README](../../plugins/duelmon-dataset/README.md).
