# Initial one-on-one battle state

> Epic: #82 — Esqueleto de una batalla Gen 1
> User story: #83 — Empezar un combate uno contra uno
> Task: #85 — Definir el estado inicial de la batalla

## Scope and privacy

This document is internal to the Duelmon plugin. It defines the initial state of
a Phase 1 one-on-one battle: the state shape, its fixed starting point, its
validation contract, and the values derived from the minimum content set. It does
not define combat rules, engine behavior, turn resolution, or published APIs; the
start contract below is an internal handoff for #86. It lives under
`docs/content/` as an internal record for the epic; it is not part of the
published documentation site.

The state embeds snapshots of content that comes from the private, locally
generated Gen 1 dataset produced by `@pocket-forge/duelmon-dataset`. That dataset
is never committed or distributed. This document only names the selected rows
already recorded in [the Phase 1 minimum content set](./82-phase-1-minimum-content.md).

This document does not modify the neutral core described in
[ADR-0001](../adr/0001-preserve-a-neutral-original-game-domain.md). The initial
state is a `Combat` snapshot from `@pocket-forge/combat`; Duelmon remains a
private consumer that adds project attributes and content snapshots.

## State root

The initial state is a `Combat` snapshot, not a separate Battle aggregate and not
a parallel view model. It is immutable and serializable through
`Combat.toPrimitives()` and `Combat.fromPrimitives()`.

The state is self-contained: the species and moves needed to read it are embedded
in each combatant's creature snapshot. Reading the initial state never requires a
catalog lookup.

The state has exactly two groups, one combatant per group, and `status: 'active'`.
Group order is meaningful: index `0` is the player side and index `1` is the
opponent side. Group ids are stable strings (`player` and `opponent` in the demo).

### Combat

| Field | Phase 1 meaning | Phase 1 value |
|---|---|---|
| `id` | Stable combat identifier | `combat-1` |
| `status` | Combat lifecycle | `active` |
| `attributes` | Combat-level battle attributes | `{}` |
| `randomPocket` | Deterministic random state | `{ seed: 42, state: 42 }` |
| `groups` | Combatant groups | Exactly two |

### Combatant Group

| Field | Phase 1 meaning | Phase 1 invariant |
|---|---|---|
| `id` | Side identifier | Unique; `player` or `opponent` |
| `attributes.activeCombatantIds` | Active subset of the group | Exactly one id, and it belongs to the group |
| `combatants` | Participants on that side | Exactly one |

`activeCombatantIds` is a group attribute, following the Active Combatant
decision recorded in the epic ([#82](https://github.com/MarioMH8/pocket-forge/issues/82)).
The array shape is forward-compatible with two active combatants; Phase 1
requires exactly one.

### Combatant

| Field | Phase 1 meaning | Phase 1 invariant |
|---|---|---|
| `id` | Stable combatant identifier | Unique across the combat |
| `groupId` | Owning group | Matches the containing group id |
| `attributes` | Battle attributes | See [Battle attributes](#battle-attributes) |
| `creature` | Content snapshot | Species and loadout moves embedded |

### Creature snapshot

| Field | Phase 1 meaning | Phase 1 value or invariant |
|---|---|---|
| `id` | Stable creature instance id | Unique and fixed |
| `species.id` | Catalog species id | Non-empty |
| `species.attributes` | Full species attributes | Includes `types` and every base stat |
| `moves` | Loadout move snapshots | One to four full `MovePrimitives` |
| `abilities` | Creature abilities | `[]`; Gen 1 has no abilities |
| `attributes` | Creature-level attributes | `{}` in Phase 1 |

Types live in the embedded species snapshot, not duplicated on the combatant.
They are content, not battle state, and embedding them keeps the state readable
without the catalog. The display tasks read
`combatant.creature.species.attributes.types`.

Moves live in the embedded creature snapshot, not in a parallel combatant list.
They are immutable content snapshots in Phase 1.

## Battle attributes

Every combatant carries the following battle attributes:

| Attribute | Type | Phase 1 value or rule |
|---|---|---|
| `level` | number | Fixed at `50` |
| `hp` | number | Current HP; starts equal to `maxHp` |
| `maxHp` | number | Derived with the Gen 1 HP formula |
| `attack` | number | Derived with the Gen 1 stat formula |
| `defense` | number | Derived with the Gen 1 stat formula |
| `special` | number | Derived with the Gen 1 stat formula; collapsed Special |
| `speed` | number | Derived with the Gen 1 stat formula |

`special` follows the dataset bridge: `baseSpecial` comes from `spa`, and `spd`
is not used by the neutral catalog. Phase 1 does not track PP, status conditions,
or stat stages on the combatant, so none of those battle-state keys are part of
the initial state. The `pp` in each move snapshot is catalog metadata only.

`maxHp` and `speed` are part of the Phase 1 state contract even though the
current action slice only reads `hp`, `level`, `attack`, `defense`, and `special`.
The builder in #86 extends the Gen 1 battle-state definitions with `maxHp` and
`speed`; `speed` is required later for the Phase 1 turn order.

## Phase 1 starting values

Phase 1 fixes the level at 50 and uses zero IVs and zero EVs. The values are
derived from the base stats recorded in
[the Phase 1 minimum content set](./82-phase-1-minimum-content.md).

### Gen 1 stat formula

```text
HP   = floor(((base + IV) * 2 + floor(sqrt(EV) / 4)) * level / 100) + level + 10
Stat = floor(((base + IV) * 2 + floor(sqrt(EV) / 4)) * level / 100) + 5
```

With `level = 50`, `IV = 0`, and `EV = 0`, the formula simplifies to:

```text
HP   = base + 60
Stat = base + 5
```

### Derived values

| Creature | Types | Level | Current HP | Max HP | Attack | Defense | Special | Speed | Loadout |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Emberling | Fire | 50 | 99 | 99 | 57 | 48 | 65 | 70 | `ember-burst`, `tackle` |
| Aquafin | Water | 50 | 104 | 104 | 53 | 70 | 55 | 48 | `aqua-burst`, `tackle` |
| Sprout | Grass | 50 | 110 | 110 | 55 | 55 | 70 | 55 | `leaf-lash`, `tackle` |

The level-50 formula is a Phase 1 simplification, not a progression system. The
demo still respects the narrative in #84: Emberling (Speed 70) acts before
Aquafin (Speed 48), and Aqua Burst does not faint Emberling in one hit. The
exchange therefore lasts more than one round, as described in
[Phase 1 demo](#phase-1-demo).

## Fixed starting point

The Phase 1 demo starts from the following fixed point:

- Content: Emberling on the player side and Aquafin on the opponent side, using
  the loadouts from #84.
- Level: `50`; IVs and EVs: `0`.
- Random seed: `42`, so `RandomPocket` starts at `{ seed: 42, state: 42 }`.
- Stable identifiers: combat `combat-1`; groups `player` and `opponent`;
  combatants `player-emberling` and `opponent-aquafin`; creatures
  `emberling-1` and `aquafin-1`.

The JSON below is the canonical fixed starting point for the Phase 1 demo. It is
the state #86 must reproduce and the fixture #89 can use.

```json
{
  "attributes": {},
  "groups": [
    {
      "attributes": {
        "activeCombatantIds": ["player-emberling"]
      },
      "combatants": [
        {
          "attributes": {
            "attack": 57,
            "defense": 48,
            "hp": 99,
            "level": 50,
            "maxHp": 99,
            "special": 65,
            "speed": 70
          },
          "creature": {
            "abilities": [],
            "attributes": {},
            "id": "emberling-1",
            "moves": [
              {
                "attributes": {
                  "accuracy": 100,
                  "alwaysHits": true,
                  "category": "Special",
                  "power": 40,
                  "pp": 25,
                  "priority": 0,
                  "type": "Fire"
                },
                "id": "ember-burst"
              },
              {
                "attributes": {
                  "accuracy": 100,
                  "alwaysHits": true,
                  "category": "Physical",
                  "power": 35,
                  "pp": 35,
                  "priority": 0,
                  "type": "Normal"
                },
                "id": "tackle"
              }
            ],
            "species": {
              "attributes": {
                "baseAtk": 52,
                "baseDef": 43,
                "baseHp": 39,
                "baseSpecial": 60,
                "baseSpeed": 65,
                "types": ["Fire"]
              },
              "id": "emberling"
            }
          },
          "groupId": "player",
          "id": "player-emberling"
        }
      ],
      "id": "player"
    },
    {
      "attributes": {
        "activeCombatantIds": ["opponent-aquafin"]
      },
      "combatants": [
        {
          "attributes": {
            "attack": 53,
            "defense": 70,
            "hp": 104,
            "level": 50,
            "maxHp": 104,
            "special": 55,
            "speed": 48
          },
          "creature": {
            "abilities": [],
            "attributes": {},
            "id": "aquafin-1",
            "moves": [
              {
                "attributes": {
                  "accuracy": 100,
                  "alwaysHits": true,
                  "category": "Special",
                  "power": 40,
                  "pp": 25,
                  "priority": 0,
                  "type": "Water"
                },
                "id": "aqua-burst"
              },
              {
                "attributes": {
                  "accuracy": 100,
                  "alwaysHits": true,
                  "category": "Physical",
                  "power": 35,
                  "pp": 35,
                  "priority": 0,
                  "type": "Normal"
                },
                "id": "tackle"
              }
            ],
            "species": {
              "attributes": {
                "baseAtk": 48,
                "baseDef": 65,
                "baseHp": 44,
                "baseSpecial": 50,
                "baseSpeed": 43,
                "types": ["Water"]
              },
              "id": "aquafin"
            }
          },
          "groupId": "opponent",
          "id": "opponent-aquafin"
        }
      ],
      "id": "opponent"
    }
  ],
  "id": "combat-1",
  "randomPocket": {
    "seed": 42,
    "state": 42
  },
  "status": "active"
}
```

### Reproducibility

The initial state is reproducible from the fixed point above:

- The same starting point produces the same `Combat.toPrimitives()` snapshot.
- `Combat.fromPrimitives(snapshot)` recreates the state without a catalog lookup.
- `toPrimitives()` → `fromPrimitives()` → `toPrimitives()` is stable.
- The state contains no timestamps, no environment-dependent values, and no
  `Math.random()` calls.
- `RandomPocket` is the only source of randomness, and it is seeded from the
  fixed starting point.

The state is a snapshot, not a replay log. Persisting or transporting it only
requires its primitives.

## Validation and errors

The implementing task (#86) resolves content into the state primitives above and
builds the state through a start contract with this shape:

```text
DuelmonCombatStart.create(primitives, definitions): Either<DuelmonCombatStartError[], Combat>
```

Validation is complete before any `Combat`, `Combatant Group`, or `Combatant` is
constructed. A failure returns `Either.left` and never a partially built state.
Errors are aggregated instead of stopping at the first violation. Each error
carries a machine-readable `reason`, a readable message, and a dot-separated
`path`.

| Rule | Reason | Path |
|---|---|---|
| Combat id is required | `invalid-combat` | `id` |
| Status is `active` | `invalid-combat` | `status` |
| Combat attributes are empty | `invalid-attribute` | `attributes.<key>` |
| Exactly two groups | `invalid-group-count` | `groups` |
| Exactly one combatant per group | `invalid-combatant-count` | `groups.<n>.combatants` |
| Group and combatant ids are unique | `duplicate-id` | `groups.<n>.id` / `groups.<n>.combatants.<m>.id` |
| `combatant.groupId` matches its group | `invalid-membership` | `groups.<n>.combatants.<m>.groupId` |
| Exactly one active id, and it belongs to the group | `invalid-active-combatant` | `groups.<n>.attributes.activeCombatantIds` |
| Required battle attributes are present | `missing-attribute` | `groups.<n>.combatants.<m>.attributes.<key>` |
| Numeric attributes satisfy their ranges | `invalid-attribute` | `groups.<n>.combatants.<m>.attributes.<key>` |
| Current HP is positive and does not exceed max HP | `invalid-hp` | `groups.<n>.combatants.<m>.attributes.hp` |
| Creature id is present | `missing-id` | `groups.<n>.combatants.<m>.creature.id` |
| Creature attributes are empty | `invalid-attribute` | `groups.<n>.combatants.<m>.creature.attributes.<key>` |
| Creature abilities are empty | `invalid-combat` | `groups.<n>.combatants.<m>.creature.abilities` |
| Species id is present | `missing-species` | `groups.<n>.combatants.<m>.creature.species.id` |
| Species types are present | `missing-types` | `groups.<n>.combatants.<m>.creature.species.attributes.types` |
| Species base stats are present and in range | `missing-attribute` / `invalid-attribute` | `groups.<n>.combatants.<m>.creature.species.attributes.<key>` |
| Move attributes are present and in range | `missing-attribute` / `invalid-attribute` | `groups.<n>.combatants.<m>.creature.moves.<k>.attributes.<key>` |
| Move snapshot is inside the Phase 1 slice | `unsupported-move` | `groups.<n>.combatants.<m>.creature.moves.<k>` |
| At least one move is present | `missing-moves` | `groups.<n>.combatants.<m>.creature.moves` |
| At most four moves, without duplicate ids | `invalid-moves` | `groups.<n>.combatants.<m>.creature.moves` |
| Random state is present and valid | `invalid-random-pocket` | `randomPocket` |

Content-resolution errors are part of the same error type and are added by #86:
an unknown species, an unknown move, or a move outside the Phase 1 constraints
must fail with a clear reason and path, never with a half-built combat.
`fromContent` aggregates structural request errors and content errors before it
returns, so a request that violates both contracts reports both sets.

## Phase 1 demo

The initial state for the demo is:

1. The player group has `player-emberling` as its active combatant: Fire,
   99/99 HP, moves `ember-burst` and `tackle`.
2. The opponent group has `opponent-aquafin` as its active combatant: Water,
   104/104 HP, moves `aqua-burst` and `tackle`.
3. Both creatures show their current and maximum HP, types, moves, and the active
   combatant.
4. Emberling uses Ember Burst; Fire is not very effective against Water.
5. Aquafin uses Aqua Burst; Water is super effective against Fire.
6. The exchange repeats. With the level-50 values above, Aqua Burst does not faint
   Emberling in one hit, so Aquafin wins after several Aqua Bursts.

Turn order and damage resolution are not part of this task. The level-50 values
are a sanity check that the initial state keeps the documented demo multi-turn
and lets Emberling act first.

## Exclusions

Phase 1 does not model:

- PP consumption; PP remains catalog metadata.
- Accuracy below 100; all selected moves always hit.
- Priority; all selected moves have priority 0.
- Status conditions, stat changes, secondary effects, or volatile statuses.
- Residual damage, switching, team changes, or reserves.
- Critical hits, high critical-hit moves, multi-hit moves, drain, recoil, OHKO
  moves, fixed damage, or charge moves.
- Turn order and turn resolution; `speed` is carried for the later turn task, but
  resolving a turn is outside this task.
- Items, capture, machine-controlled opponents, saving, progression, and the
  complete visual interface.

## Handoff to later tasks

### Battle start (#86)

Resolve the selected species and moves through `DuelmonCatalog`, validate that
every referenced entry exists and every move satisfies the Phase 1 constraints,
derive the level-50 values with the Gen 1 formula, and build the state through
`DuelmonCombatStart`. Extend the Gen 1 battle-state attribute definitions with
`maxHp` and `speed`, and add the group `activeCombatantIds` definition. Return
content and state errors together, never a partial combat.

### Show the initial state (#87)

Read the same `Combat` snapshot used by battle resolution. Do not keep a manual
copy of the state. Show each group's active combatant id, current and maximum HP,
the embedded species types, and the embedded loadout moves.

### Record the start (#88)

Record the initial state in the basic history as the serialized state, not as a
separate hand-built summary.

### Product tests (#89)

Use the fixed starting point in this document. Cover valid content (Emberling
against Aquafin), incomplete content (a missing move), and invalid content (a
move with a status or secondary effect). Assert that no partial combat is
returned, that functions outside Phase 1 are not exposed, and that the history
records the start.

## Acceptance criteria

- [x] The state includes current and maximum HP, type, moves, and the active
      creature.
- [x] The state can be recreated from the fixed starting point in this document.
- [x] Invalid or incomplete content is represented as an aggregated error, not as
      a partial state.
- [x] The initial state is documented and sufficient to build the battle.

## References

- [Epic #82 — Esqueleto de una batalla Gen 1](https://github.com/MarioMH8/pocket-forge/issues/82)
  (delivery plan and decision record).
- User story #83 — Empezar un combate uno contra uno.
- Task #85 — Definir el estado inicial de la batalla.
- Task #84 — [Phase 1 minimum content set](./82-phase-1-minimum-content.md).
- [ADR-0001 — Preserve a neutral, original game domain](../adr/0001-preserve-a-neutral-original-game-domain.md).
- [ADR-0002 — Make simulation deterministic](../adr/0002-make-simulation-deterministic.md).
- [ADR-0014 — Split Combat state and Combat engine packages](../adr/0014-split-combat-state-and-engine-packages.md).
- [Combat glossary](../../packages/combat/CONTEXT.md).
- [Duelmon glossary](../../plugins/duelmon/CONTEXT.md).
- [Duelmon dataset README](../../plugins/duelmon-dataset/README.md).
