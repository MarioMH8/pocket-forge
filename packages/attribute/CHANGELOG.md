# @pocket-forge/attribute

## 0.1.0

### Minor Changes

- 4de6fb4: Support typed records and arrays of records in attribute definitions, values, nested defaults, and JSON persistence.

### Patch Changes

- 1a98687: Emit each package's subpath entries so the built `dist` matches its `exports` map. Single-entry packages now build to `dist/domain/index.mjs` instead of `dist/index.mjs`, and `attribute` also builds its `infrastructure` entrypoint.
