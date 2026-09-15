# Dependencies

- **peerDependencies**: all runtime dependencies from `@hexadrop/*`, `reflect-metadata`, `ulid`. Versions use **caret** (`^`) to allow compatible updates.
- **peerDependenciesMeta**: `reflect-metadata` and `ulid` marked `optional: true`.
- **devDependencies**: same as peerDependencies (needed for development) plus `tsdown`, `@faker-js/faker`. Versions are **pinned** (no `^` or `~`).

## tsconfig paths

The root `tsconfig.json` maps `@pocket-forge/*` paths for development resolution:

```json
{
  "@pocket-forge/*/application": ["./packages/*/src/application/index.ts"],
  "@pocket-forge/*/domain": ["./packages/*/src/domain/index.ts"],
  "@pocket-forge/*/mock/domain": ["./packages/*/mock/domain/index.ts"],
  "@pocket-forge/*/mother/domain": ["./packages/*/mother/domain/index.ts"],
  "@pocket-forge/*/mother/application": ["./packages/*/mother/application/index.ts"],
  "@pocket-forge/*": ["./packages/*/src/index.ts"]
}
```

More specific paths must come **before** the catch-all `@pocket-forge/*`.

## package.json exports

Production exports point to `dist/`. Development-only exports (`mock/`, `mother/`) only have the `"development"` condition:

```json
{
  "./domain": {
    "development": "./src/domain/index.ts",
    "types": "./dist/domain/index.d.mts",
    "default": "./dist/domain/index.mjs"
  },
  "./mock/domain": {
    "development": "./mock/domain/index.ts"
  }
}
```
