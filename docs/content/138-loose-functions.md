# No loose module-level functions

> Task: #138 — Remove loose module-level functions from the turn stack
> Parent story: #122

## Rule

A module must not declare free functions. A helper that only exists for one file
lives as a static method of a class in that same file:

- Production: `private static` when only the owning class uses the helper.
- Tests: `static` on a local fixture class, and `private static` when only other
  methods of that fixture use it.

Inline arrow functions inside `map`, `filter`, `sort`, or a test body are still
allowed. The rule only bans top-level function declarations.

## Applied pattern

Every helper keeps its original name, parameters, logic, and JSDoc; only its
owner changes. Calls inside the class use `this`, so a fixture reads as a small
namespace:

```ts
class SpeedOrderFixture {
  static activeCombatants(combat: Combat): readonly DuelmonCombatant[] {
    return DuelmonCombat.fromCombat(combat)
      .groups()
      .flatMap(group => group.activeCombatants());
  }

  static combatant(combat: Combat, id: string): DuelmonCombatant {
    const found = this.activeCombatants(combat).find(candidate => candidate.id === id);

    if (!found) {
      throw new Error(`Missing active combatant "${id}"`);
    }

    return found;
  }
}
```

Tests call the fixture explicitly, for example
`SpeedOrderFixture.activeCombatants(combat)`. No aliases such as
`const orderOf = SpeedOrderFixture.orderOf` were introduced.

## Files

Production:

- `plugins/duelmon/src/domain/turn/duelmon-turn-declarations.ts` —
  `prefixPath` and `phaseOneShapeErrors` became `private static` methods of
  `DuelmonTurnDeclarations`.

Tests:

| File | Helpers | Fixture |
| --- | --- | --- |
| `tests/domain/turn/duelmon-speed-order.test.ts` | 4 | `SpeedOrderFixture` |
| `tests/domain/turn/duelmon-turn-declarations.test.ts` | 14 | `TurnDeclarationsFixture` |
| `tests/domain/turn/duelmon-combat-turn.test.ts` | 13 | `CombatTurnFixture` |
| `tests/domain/history/duelmon-combat-history-entry.test.ts` | 3 | `HistoryEntryFixture` |
| `tests/domain/history/duelmon-combat-history.test.ts` | 3 | `HistoryFixture` |
| `tests/integration/turn-resolution.test.ts` | 9 | `TurnResolutionFixture` |
| `tests/integration/turn-history.test.ts` | 8 | `TurnHistoryFixture` |
| `tests/integration/turn-order-product.test.ts` | 12 | `TurnOrderProductFixture` |
| `tests/integration/turn-declaration.test.ts` | 6 | `TurnDeclarationFixture` |

In `duelmon-combat-turn.test.ts`, the type guards `isAttributeRecord` and
`isAttributeRecordArray` are `private static`: only other methods of
`CombatTurnFixture` use them. `consumeMovePp` moved to the same fixture because
`StubResolver` and the Move PP assertions share it.

## Criteria

- No top-level `function` declaration remains in the listed files.
- Behaviour is unchanged: no assertion, expected value, test name, or test order
  was modified.
- Helpers stay file-local; nothing moved to `mother/` and no dependency was
  added.

Verification:

```sh
grep -nE '^(export )?(default )?(async )?function ' \
  plugins/duelmon/src/domain/turn/duelmon-turn-declarations.ts \
  plugins/duelmon/tests/domain/turn/duelmon-speed-order.test.ts \
  plugins/duelmon/tests/domain/turn/duelmon-turn-declarations.test.ts \
  plugins/duelmon/tests/domain/turn/duelmon-combat-turn.test.ts \
  plugins/duelmon/tests/domain/history/duelmon-combat-history-entry.test.ts \
  plugins/duelmon/tests/domain/history/duelmon-combat-history.test.ts \
  plugins/duelmon/tests/integration/turn-resolution.test.ts \
  plugins/duelmon/tests/integration/turn-history.test.ts \
  plugins/duelmon/tests/integration/turn-order-product.test.ts \
  plugins/duelmon/tests/integration/turn-declaration.test.ts
```

The command prints nothing and exits with status 1 because there are no matches.

## Results

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `bun test plugins/duelmon --conditions=development` | 340 pass, 0 fail, 1320 expect() calls, 34 files |
| `bun run test` | 587 pass, 0 fail, 2940 expect() calls, 62 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass, no findings |
