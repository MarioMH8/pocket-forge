---
'@pocket-forge/species': minor
---

Remove the species repository and its JSON implementation.

`@pocket-forge/species` no longer exports `SpeciesRepository` or the `./infrastructure` entrypoint. The package keeps the `Species` entity and its primitives; persistence is left to consumers. The `zod` dependency is removed.
