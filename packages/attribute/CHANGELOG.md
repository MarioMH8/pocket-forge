# @pocket-forge/attribute

## 0.0.1

### Patch Changes

- 1a98687: Emit each package's subpath entries so the built `dist` matches its `exports` map. Single-entry packages now build to `dist/domain/index.mjs` instead of `dist/index.mjs`, and `attribute` also builds its `infrastructure` entrypoint.
