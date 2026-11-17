# Make the Pack the unit of distribution and selection

A project must be able to adopt content, configuration, assets, locales, and extensions without naming every package that carries them. We make the **Pack** that unit: a versioned, publishable bundle with one `manifest.json` file, `content/`, `assets/`, `locales/`, an optional `./pack` module that declares neutral bindings and extension implementations, and an optional `./domain` barrel that re-exports the catalog packages it composes. A project lists Pack names in `pocket-forge.config.ts`; a build step turns them into a generated `packs.generated.ts` with static imports, an npm lockfile resolves distribution versions, and a resolver in the new `pack` context validates contributions and content contracts, merges pack bindings, applies the project's content overrides and bindings, and returns a neutral `GameDefinition`. The resolver knows no subsystem and no dependency-injection container; the app assembles subsystems with pure functions and wires whichever container it chooses.

## Considered Options

- **Pack as a compositor of catalog packages resolved by a custom registry**: lets content live outside npm, but rebuilds version resolution, integrity, and caching: a package manager.
- **Typed manifest sections (`content`, `locales`, `assets`, `editor`)**: self-documenting, but every new contribution category changes the core schema, which contradicts "anything that comes later".
- **Packs export `register(container, options)`**: natural for DI, but the container enters the Pack's interface and the Pack stops being a neutral, acyclic descriptor.
- **The resolver returns a configured container, or builds `CombatSetup` directly**: fewer moving parts today, but `pack` would depend on a DI library and on every subsystem, so it stops being neutral for maps, inventory, or encounters.
- **Nested override maps with merge semantics**: compact, but partial merges hide intent; an explicit `replace`/`remove` list is reviewable.
- **A single global schema version per Pack**: simple, but moving one catalog forces every other catalog to migrate.

## Consequences

- `manifest.json` reuses the name planned in `docs/grill/0002` Q16, but redesigns its shape: the typed editor, game, locale, and migration sections become uniform contributions.
- `plugins/` becomes `packs/`; `combat-reference` is a Pack that contains extensions.
- Catalog packages are published per kind and editorial set (`@ana/moves-core`), and Packs re-export the ones they need.
- A Pack that contributes an unclaimed `kind`, or content that violates its declared contract, fails at resolve time with an aggregated error; nothing is dropped silently.
- Content overrides live only in the project config and support whole-entry `replace` and `remove`; adding content means adding a Pack, not an override.
- Content conflicts are errors, while binding conflicts are layering: a later Pack shadows an earlier binding and the shadowing is recorded in provenance (see ADR-0013).
- The editor consumes `manifest.json` and `content/` as data, with no TypeScript build step.
- Content migrations and broader contract ranges remain future work, sharing the versioning model of ADR-0010.
