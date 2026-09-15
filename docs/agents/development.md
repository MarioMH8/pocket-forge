# Development and testing

Use the smallest command that validates the changed behavior.

## Commands

| Task                      | Command                                             |
|---------------------------|-----------------------------------------------------|
| Install dependencies      | `bun install`                                       |
| Run all unit tests        | `bun run test`                                      |
| Run tests for one package | `bun test packages/<name>`                          |
| Run tests for one file    | `bun test packages/<name>/tests/<file>.test.ts`     |
| Lint and fix              | `bun run lint:fix`                                  |
| Type-check                | `bun run typecheck`                                 |
| Build one package         | `bun run --filter @pocket-forge/game-session build` |

## `--conditions=development`

Tests and type-checking rely on the `"development"` export condition to resolve `mock/` and `mother/` paths. The root `package.json` scripts already include it:

```json
{
  "test": "bun test --conditions=development",
  "typecheck": "tsc --noEmit"
}
```

The root `tsconfig.json` includes `"customConditions": ["development"]` so `tsc` also resolves these paths. When running `bun test` directly (without the root script), always pass the flag:

```bash
bun test --conditions=development
```
