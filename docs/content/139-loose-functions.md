# Class-owned helpers

> Requested on 2026-11-26.
> Task: #139 — Auditar y asociar a clases las funciones sueltas de toda la base de código.

## Rule

No module-level or nested function declarations. A helper that belongs to one
file lives as a static method of a class in that same file:

- `private static` when only the owning class uses it;
- `static` when a test invokes it from outside the fixture class.

Inline arrow functions inside `map`, `filter`, `sort`, or an `it` callback stay
as they are: they are expressions, not loose functions. A top-level `await` in a
CLI entry file is allowed because it is not a function.

File-specific helpers are not moved to shared utilities or to `mother/`: the
point is to keep them owned by the file that needs them.

## What changed

### Packages and docs

- `packages/attribute`: `DefinitionsFixture`.
- `packages/combat-engine`: `RulesFixture`, `CompletionFixture`, `CompositionFixture`,
  `CompletionConfigFixture`, `BindingSetFixture`, `ResolverFixture`, `EngineFakes`,
  `EngineFixture`.
- `apps/docs`: `DocumentationIntegration`, `GlossaryGenerator`, `TypedocGenerator`.
  `extractGlossary`, `addFrontmatter`, and `processDirectory` are `private static`.

### `plugins/duelmon`

Production helpers moved into their owner:

| File | Helper | Destination |
| --- | --- | --- |
| `src/domain/start/duelmon-combat-start.ts` | `isNonEmptyString`, `isStringArray` | `DuelmonCombatStart` (`private static`) |
| `src/domain/support/duelmon-combat.input.ts` | `isNonEmptyString` | `DuelmonCombatInput` (`private static`) |
| `src/domain/support/duelmon-target.ts` | `isNonEmptyString` | `DuelmonTarget` (`private static`) |
| `src/domain/action/use-move/use-move.action.ts` | `combatAfter` | `UseMoveAction` (`private static`) |

The 22 test files outside the turn-order stack get one local fixture each
(`CombatStartFixture`, `MoveFixture`, `UseMoveFixture`, `CombatEngineFixture`,
`CatalogFixture`, etc.). Two nested helpers inside a `describe` block were moved
to their fixture as well (`CatalogFixture.move`, `CatalogFixture.catalogWith`,
`CombatStartContentFixture.speciesView`, `CombatStartContentFixture.moveView`).

### `plugins/duelmon-dataset`

- `DuelmonDatasetBuilder`: the 19 module helpers become `private static`; the
  public `build` API and exported types are unchanged.
- CLI: `DuelmonDatasetCli`, `ShowdownSource`, `ExtractDataset`, `ExtractCommand`.
  The entry `cli/index.ts` still owns the top-level `await` and the error
  handling.
- `DuelmonDatasetMother.baseStats` is `private static`; `MOVES`/`SPECIES` became
  `private static readonly` so the mother can initialize them.
- `DatasetFixture` groups the four test helpers.

## Overlap with the turn-order stack

The files introduced or touched by the turn-order stack are corrected in #138:
`plugins/duelmon/src/domain/turn/duelmon-turn-declarations.ts`,
`tests/domain/turn/duelmon-speed-order.test.ts`,
`tests/domain/turn/duelmon-turn-declarations.test.ts`,
`tests/domain/turn/duelmon-combat-turn.test.ts`,
`tests/domain/history/*`, `tests/integration/turn-resolution.test.ts`,
`tests/integration/turn-history.test.ts`,
`tests/integration/turn-order-product.test.ts`, and
`tests/integration/turn-declaration.test.ts`.

This task is based on `develop`; once the stack and this change are merged, no
file keeps a loose function. The verification below excludes those stack files
and generated Astro types (`apps/docs/.astro/`).

## Verification

Executed on 2026-11-26:

| Command | Result |
| --- | --- |
| `grep -rnE '^(export )?(default )?(async )?function \|^[[:space:]]+(export )?(async )?function '` over `packages`, `plugins`, `apps` (excluding `dist`, `node_modules`, `.astro`) | only the six stack files covered by #138 |
| `bun test plugins/duelmon-dataset --conditions=development` | 14 pass, 0 fail |
| `bun test plugins/duelmon --conditions=development` | 235 pass, 0 fail |
| `bun run test` | 482 pass, 0 fail, 2451 expect() calls, 56 files |
| `bun run typecheck` | Pass |
| `bun run lint:ci` | Pass |
| `bun run --filter @pocket-forge/duelmon-dataset build` | Pass |
| CLI smoke (`--help`, `extract` without `--source`) | Expected help and exit 1 with the zod message |

## Acceptance criteria

- [x] No module-level `function` in the touched source and test files.
- [x] No nested `function` in the touched test files.
- [x] File helpers are static methods of a local class.
- [x] Production APIs and behavior unchanged.
- [x] Full suite, typecheck, lint, and dataset build pass.
- [x] The remaining stack files are covered by #138.

## References

- #139 — Audit and class association of loose functions.
- #138 — Same rule applied to the turn-order stack.
