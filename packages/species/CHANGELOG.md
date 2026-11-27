# @pocket-forge/species

## 0.1.0

### Minor Changes

- 54d54b9: Remove `name` and `description` from catalog entities.
  
  `Ability` and `Move` drop both `name` and `description`; `Species` and `Creature` drop `name`. The entities are identified by `id` and carry gameplay data in their validated attributes. The `create` factories, primitives, and Duelmon catalog mapping are updated accordingly.
- 2698842: Remove the species repository and its JSON implementation.
  
  `@pocket-forge/species` no longer exports `SpeciesRepository` or the `./infrastructure` entrypoint. The package keeps the `Species` entity and its primitives; persistence is left to consumers. The `zod` dependency is removed.

### Patch Changes

- 1a98687: Emit each package's subpath entries so the built `dist` matches its `exports` map. Single-entry packages now build to `dist/domain/index.mjs` instead of `dist/index.mjs`, and `attribute` also builds its `infrastructure` entrypoint.
- Updated dependencies [4de6fb4]
- Updated dependencies [1a98687]
  - @pocket-forge/attribute@0.1.0
