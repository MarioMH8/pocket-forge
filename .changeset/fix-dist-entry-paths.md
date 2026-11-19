---
'@pocket-forge/ability': patch
'@pocket-forge/attribute': patch
'@pocket-forge/creature': patch
'@pocket-forge/move': patch
'@pocket-forge/rng': patch
'@pocket-forge/species': patch
---

Emit each package's subpath entries so the built `dist` matches its `exports` map. Single-entry packages now build to `dist/domain/index.mjs` instead of `dist/index.mjs`, and `attribute` also builds its `infrastructure` entrypoint.
