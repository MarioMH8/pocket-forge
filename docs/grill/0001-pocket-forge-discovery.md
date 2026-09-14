# Pocket Forge discovery decisions

This record preserves every question and outcome from the initial Pocket Forge design interview. It provides reviewable context for the agreed product direction; it does **not** define the final package boundaries, which were intentionally deferred.

## Quick path

1. Start with the accepted decisions table to understand the product boundary.
2. Use the numbered decision log when rationale or a correction matters.
3. Treat deferred items as open design work, not implicit decisions.

## Accepted direction

| Area | Decision |
|---|---|
| Audience | Mixed teams: TypeScript developers and visual-content designers. |
| Initial product | A single-player 2D vertical slice, not multiplayer. |
| Platforms | One web/PWA runtime, packaged through Tauri and Capacitor adapters. |
| Game model | A specialized but configurable creature-collection RPG model using original, neutral terminology. |
| Content | Canonical, versioned JSON validated by JSON Schema; trusted compiled TypeScript extensions. |
| Simulation | Immutable serializable state, deterministic commands/events, explicit PRNG seed, and fixed ticks. |
| Presentation | React for UI; Phaser for the 2D scene. |
| Editor | A Tauri visual editor that supports the full vertical-slice workflow. |
| Tooling | Bun workspaces and tests, tsdown ESM packages, Changesets, and a managed Vite-based bundler. |
| License | Apache-2.0. |
| Package design | Explicitly deferred. |

## Decision log

### Product and legal boundary

#### Q1 — Initial user and value proposition
**Question:** Who should Pocket Forge serve first: TypeScript developers, no-code designers, or mixed teams?

**Answer:** Mixed teams.

**Context:** The runtime must remain explicit and programmable, while the editor must let designers create content without editing code.

#### Q2 — First-release scope
**Question:** What complete experience must the first release create?

**Answer:** A 2D single-player vertical slice: tile-map exploration, collisions and zones, configurable encounters, turn-based battles, inventory and saves, and basic dialogue/events. It excludes multiplayer and real-time creature combat.

**Context:** This replaced the initial answer of a full multiplayer engine.

#### Q3 — Multiplayer model
**Question:** What multiplayer model should the first release support?

**Answer:** Not applicable.

**Context:** Q2 was corrected to exclude multiplayer from the first release.

#### Q3 — Intellectual-property protection
**Question:** How should templates, examples, naming, and generated content avoid infringement?

**Answer:** Strict neutrality with original examples.

**Context:** Branding and documentation are neutral; official examples, templates, and assets are original; redistribution of third-party content is prohibited. The engine does not try to technically police user content.

#### Q6 — Distribution and license model
**Question:** Should Pocket Forge be open infrastructure or a controlled commercial product?

**Answer:** Permissive open source.

**Context:** The concrete license was later settled as Apache-2.0.

#### Q36 — Concrete permissive license
**Question:** Should the project use MIT or Apache-2.0?

**Answer:** Apache-2.0 for the entire monorepo.

**Context:** Example-asset origin and licensing should be documented separately.

#### Q48 — Open-source governance
**Question:** What contribution model should the project use initially?

**Answer:** Founder-led maintenance with a DCO and API RFCs.

**Context:** Add a contribution guide and Code of Conduct; no foundation or committee is needed for v1.

#### Q61 — Asset compliance metadata
**Question:** Should the CLI/editor enforce license and provenance metadata for assets?

**Answer:** Do not manage compliance metadata.

**Context:** Legal neutrality applies to official project material, but user projects are not blocked or checked by the tooling.

### Runtime and content

#### Q4 — Cross-platform strategy
**Question:** What platform commitment should Pocket Forge make?

**Answer:** Web/PWA, Tauri, and Capacitor through adapters.

**Context:** The web runtime is the reference target; platform capabilities must not leak into the core.

#### Q5 — Game source format
**Question:** Should projects be declarative content or TypeScript APIs?

**Answer:** Versionable declarative content plus TypeScript extensions.

**Context:** This supports designer/developer collaboration and readable diffs without preventing programmed rules.

#### Q7 — Canonical content syntax
**Question:** Should the canonical format be JSON, YAML, or a binary/database format?

**Answer:** JSON with JSON Schema.

**Context:** YAML import/export may be added later, but JSON is the stable persistent contract.

#### Q54 — Source of truth for content contracts
**Question:** Are schemas or TypeScript definitions authoritative?

**Answer:** JSON Schema is authoritative.

**Context:** TypeScript types and editor forms are generated from the schema.

#### Q55 — JSON canonicalization
**Question:** Should the editor and CLI normalize JSON order?

**Answer:** Canonical formatting while preserving semantic list order.

**Context:** Stable-ID collections can be ordered deterministically, while event steps, layers, and options retain authored order.

#### Q8 — Degree of game-engine opinion
**Question:** Should the engine impose a creature-collection loop or remain fully generic?

**Answer:** A specialized, configurable core.

**Context:** It uses neutral concepts such as creature, party, action, encounter, and battle, with data-defined rules and extension points.

#### Q11 — Extension model
**Question:** How are TypeScript extensions loaded and isolated?

**Answer:** They are compiled and trusted.

**Context:** An author explicitly registers extensions through a typed manifest. They are not third-party runtime downloads; platform adapters use declared ports and permissions.

#### Q15 — Runtime state model
**Question:** How should live game state be modeled?

**Answer:** Immutable state advanced by deterministic commands that yield new state and domain events.

**Context:** This makes saves, replay, tests, and future multiplayer reliable.

#### Q16 — Reproducible randomness
**Question:** Should game randomness use injected seeds and PRNGs?

**Answer:** Yes.

**Context:** Sessions and battles have explicit seeds, persist PRNG progress, and never use `Math.random()` in domain rules.

#### Q19 — Game persistence
**Question:** What save guarantees must the official system provide?

**Answer:** Versioned JSON snapshots with migrations and platform adapters.

**Context:** Provide IndexedDB, Tauri filesystem, and Capacitor storage adapters. Cloud sync and accounts are out of scope for v1.

#### Q32 — UI accessibility
**Question:** What measurable accessibility commitment should v1 make for React UI, the editor, and the Phaser canvas?

**Answer:** WCAG 2.2 AA for React UI and the editor, with text alternatives and accessible navigation for critical in-game actions.

**Context:** Full canvas accessibility is not promised in v1; keyboard operation, focus management, contrast, labels, and reduced-motion preferences are required for React-based UI.

#### Q33 — Localization
**Question:** Does v1 include internationalization?

**Answer:** Yes: translation keys and JSON locale catalogs.

**Context:** Content stores keys, catalogs have an explicit fallback, and the editor can edit and preview locales. Automatic translation is excluded.

#### Q35 — Compatibility policy
**Question:** How should packages, content, and saves evolve?

**Answer:** SemVer plus migratable schemas and saves.

**Context:** Documents and snapshots carry explicit versions; official migrators support the two most recent schema majors.

#### Q38 — Telemetry and privacy
**Question:** Should the toolkit collect telemetry?

**Answer:** No telemetry by default; local observability and opt-in adapters only.

### World, events, and assets

#### Q9 — Event system
**Question:** What expression level should the visual event editor provide?

**Answer:** A deterministic command graph with registered TypeScript extension calls.

**Context:** It supports dialogue, variables, conditions, choices, teleportation, switches, inventory changes, encounters, and battles. Arbitrary JavaScript authored in the editor is excluded.

#### Q17 — Map format and interoperability
**Question:** Should maps be proprietary or interoperable with Tiled?

**Answer:** A versioned internal model with optional Tiled JSON import/export.

**Context:** Pocket Forge retains a specialized editor without isolating teams that use Tiled.

#### Q18 — Asset management
**Question:** How should sprites, tilesets, audio, and fonts be represented?

**Answer:** A manifest with stable IDs and relative paths.

**Context:** The editor references asset IDs; the CLI validates paths, duplicates, and unused assets.

#### Q49 — Runtime audio
**Question:** What audio support belongs in v1?

**Answer:** Basic cross-platform audio addressed by asset IDs.

**Context:** Include music/effects, master/music/effects buses, persistent volume, and mobile/Safari-safe behavior; exclude audio editing and spatial mixing.

#### Q50 — External game assets
**Question:** May the asset manifest use remote URLs?

**Answer:** Local packaged assets only.

**Context:** This corrects the initially discussed remote-download/build-time conversion approach. Q51 is therefore inapplicable.

#### Q51 — Remote asset integrity
**Question:** What metadata must downloaded remote assets carry?

**Answer:** Not applicable.

**Context:** Q50 was corrected to local assets only.

#### Q56 — Event cycles and execution
**Question:** How should loops in event graphs work?

**Answer:** Only explicit, bounded loops with an exit condition; implicit cycles are validation errors.

**Context:** Execution cooperates with a tick budget so an event cannot freeze the UI.

#### Q60 — Generated project layout
**Question:** Should generated projects have a standard directory layout?

**Answer:** An explicit, configurable convention.

**Context:** Use `content/`, `assets/`, `extensions/`, `locales/`, `src/`, and `pocket-forge.config.ts`, referenced by a root manifest. Ejected projects may take responsibility for different paths.

### Gameplay model

#### Q20 — Input system
**Question:** Which controls must the runtime abstract from day one?

**Answer:** Semantic actions supporting keyboard, controller, and touch.

**Context:** Renderers receive actions such as move, confirm, cancel, and menu rather than raw keys or gestures. Support remapping and keyboard/controller UI navigation.

#### Q21 — Initial battle contract
**Question:** What battle variants belong in v1?

**Answer:** Include doubles and multiple battles in v1.

**Context:** Q22 then constrained the concrete first-release capacity.

#### Q22 — Multiple-battle limit
**Question:** What exact capacity should multiple battles have?

**Answer:** Up to two active Combatants per side, including 2v2.

**Context:** Support configurable targets and 1v1/2v1. Design contracts for more slots, but do not implement 3v3 or larger formats in v1.

#### Q23 — Creature systems in v1
**Question:** Which creature lifecycle systems must be implemented?

**Answer:** Recruitment, progression, transformations, breeding, and transfer.

**Context:** Transfer was narrowed by Q24; cosmetics were later excluded by Q26.

#### Q24 — Transfer without multiplayer
**Question:** How can transfer exist while Q2 excludes multiplayer?

**Answer:** Local/offline transfer in v1; online transfer later.

**Context:** Implement a deterministic compatible-save transfer format or local adapter, not online player trading.

#### Q25 — Breeding scope
**Question:** What breeding model should Pocket Forge provide?

**Answer:** Generic declarative, original rules.

**Context:** Games define compatibility, offspring recipes, traits, and inheritance using the injected PRNG. No copied nomenclature or formulas.

#### Q26 — Cosmetics
**Question:** Should v1 include cosmetic customization?

**Answer:** Omit cosmetics from v1.

#### Q34 — Battle AI
**Question:** What NPC battle AI belongs in v1?

**Answer:** Deterministic weighted AI plus TypeScript strategy extensions.

**Context:** Configure priorities/weights for action, target, and replacement selection; defer advanced planning and learning.

#### Q57 — Action effects
**Question:** How do designers define damage, status, buffs, and related effects?

**Answer:** A deterministic declarative effect DSL with TypeScript handlers registered by ID.

**Context:** The editor renders DSL forms. JSON never serializes executable handler code.

#### Q58 — Content identity and references
**Question:** Should content identifiers be UUIDs, slugs, or both?

**Answer:** Namespaced stable slugs; UUIDs only for internal editor entities.

**Context:** Do not reuse deleted IDs. Migrations map previous IDs explicitly.

#### Q59 — Affinities and formulas
**Question:** Are affinity tables and damage/progression formulas fixed by the engine?

**Answer:** They are configurable by each Game Project.

**Context:** Pocket Forge supplies resolution contracts and neutral example presets, not franchise-derived constants or categories.

#### Q64 — 2D map rendering model
**Question:** What map geometry is supported initially?

**Answer:** Layered orthogonal tile maps.

**Context:** Include terrain, decoration, collision, triggers, grid placements, and a configurable camera. Isometric, elevation, and procedural maps are deferred.

#### Q65 — Exploration movement
**Question:** Is exploration movement grid-based or free physics?

**Answer:** Deterministic tile-by-tile movement with Phaser interpolation.

**Context:** This preserves exact saves/replays and predictable triggers, collisions, and zones.

#### Q66 — Simulation clock
**Question:** How does deterministic simulation advance?

**Answer:** Fixed command/tick simulation with interpolated rendering.

**Context:** Simulation cannot depend on `requestAnimationFrame`; pausing, saving, and replay remain stable under varying FPS.

### Presentation, editor, and delivery

#### Q10 — Visual architecture
**Question:** How should React and Phaser divide responsibilities?

**Answer:** React renders game UI such as menus and Dex-like catalogs; Phaser renders the 2D scene.

**Context:** The editor uses Tauri + React and can reuse the game renderer for preview/playtest.

#### Q27 — v1 editor scope
**Question:** Which editor tools are required to publish the vertical slice without hand-editing JSON?

**Answer:** The complete vertical-slice workflow.

**Context:** Include project creation, assets, maps/tiles/zones/collisions, event graphs, forms for creatures/actions/encounters/items, schema validation, local preview/playtest, and packaging. Animation, audio, visual AI, and simultaneous collaboration are deferred.

#### Q28 — Collaboration and version control
**Question:** Should the editor ship a Git client or rely on compatible files?

**Answer:** Git-compatible files without a full Git UI.

**Context:** The editor detects/validates conflicts and can link to the repository; the CLI formats and validates in CI.

#### Q39 — Editor extensibility
**Question:** Can game extensions contribute arbitrary React panels to the editor?

**Answer:** Yes, from v1.

**Context:** This superseded the recommendation to limit v1 extensions to declarative schemas, forms, and event nodes.

#### Q40 — Editor extension trust boundary
**Question:** Should compiled custom panels be sandboxed?

**Answer:** Compiled panels are trusted and unsandboxed.

**Context:** Authors must decide which package dependencies to trust. Remote runtime panel downloads are excluded.

#### Q41 — Editor extension API compatibility
**Question:** How should the host prevent broken extensions?

**Answer:** A versioned editor API and compatible peer-dependency ranges.

**Context:** Validate compatibility when opening the project and refuse incompatible extensions with clear errors.

#### Q42 — Supported desktop editor platforms
**Question:** Which desktop systems receive official editor builds?

**Answer:** macOS, Windows, and Linux.

#### Q43 — Editor distribution and updates
**Question:** How are editor releases delivered?

**Answer:** Signed GitHub Releases with manual update notification.

**Context:** Automatic updates are deferred.

#### Q52 — Delivery of generated games
**Question:** Should Pocket Forge publish games to stores for the author?

**Answer:** Produce web/PWA builds and desktop/mobile artifacts ready for the author to sign and publish.

**Context:** Creators supply credentials, application IDs, icons, certificates, and store publication steps.

#### Q53 — Reference project
**Question:** What should the repository demonstrate?

**Answer:** A complete, original, playable example.

**Context:** It demonstrates tile exploration, double battles, recruitment, breeding, local transfer, localization, saves, audio, and the editor-to-CLI-to-web/PWA workflow without protected terminology or assets.

#### Q62 — Playtest debugging
**Question:** Which diagnostic tools are included in v1 playtest mode?

**Answer:** An inspector plus deterministic replay.

**Context:** The inspector exposes serialized state, the PRNG seed and progress, event queue, variables/switches, the entity under the cursor, and schema errors. A full visual step debugger is deferred.

#### Q63 — React UI package model
**Question:** Should React UI be themed components or headless primitives?

**Answer:** Neutral, themeable accessible components plus headless primitives.

**Context:** Games may replace the presentation entirely; no official visual identity should evoke an existing franchise.

### Toolchain and delivery plan

#### Q12 — Public package boundaries
**Question:** Should users consume a monolithic SDK or modular npm packages?

**Answer:** Small, capability-bounded packages with multiple entrypoints; no SDK.

**Context:** Candidate domains included player, creature, dex, combat, and renderer-phaser. The final package list and boundaries remain deferred.

#### Q13 — Domain-package dependencies
**Question:** Should domain packages use a shared core/contracts package or import each other?

**Answer:** Imports between packages with peerDependencies where appropriate; avoid generic `core` or `shared` packages.

**Context:** A narrow generic package such as `entity` is permissible when needed.

#### Q14 — Dependency cycles
**Question:** What rule prevents peerDependencies from becoming cyclic coupling?

**Answer:** An acyclic dependency graph with minimal, focused abstractions.

**Context:** Extract only a necessary contract rather than creating a catch-all shared module.

#### Q29 — Monorepo toolchain
**Question:** Which workspace, test, build, and publishing tools are official?

**Answer:** Bun workspaces and test runner, tsdown for ESM packages and declarations, Changesets for versioning/publication, and Tauri/Vite for the editor.

**Context:** This replaced the suggested pnpm/Turborepo/Vitest stack.

#### Q30 — JavaScript distribution contract
**Question:** Are packages ESM-only or dual ESM/CommonJS?

**Answer:** ESM-only with explicit export maps and bundled types.

**Context:** Document a minimum Node/Bun version; games bundle for the browser rather than receive CommonJS output.

#### Q31 — Browser support
**Question:** Which browsers are official targets?

**Answer:** The latest two stable releases of Chrome/Edge, Firefox, and Safari, including current Safari on iOS.

**Context:** Legacy browsers are excluded.

#### Q37 — Validation strategy
**Question:** Which testing layers block a release?

**Answer:** Unit/property tests, integration tests, migrations/content fixtures, and editor smoke/E2E tests.

**Context:** Visual Phaser snapshots are optional when stable.

#### Q44 — CLI role
**Question:** What commands must the CLI provide?

**Answer:** Create, validate, format, migrate, build, and test content.

**Context:** It supports automation and CI but does not replace the editor or administer cloud deployment.

#### Q45 — Generated-project build system
**Question:** What build system should generated games use?

**Answer:** A Pocket Forge-managed bundler based on Vite that hides Tauri and Capacitor integrations.

**Context:** This superseded a plain Vite-template recommendation.

#### Q46 — Managed-bundler configuration
**Question:** How can advanced projects customize that bundler?

**Answer:** A typed `pocket-forge.config.ts` with typed hooks and an explicit documented irreversible eject path.

**Context:** Internal Vite/Tauri/Capacitor configuration is not exposed by default.

#### Q47 — npm namespace
**Question:** Under which npm scope are official packages published?

**Answer:** `@pocket-forge`.

#### Q67 — Delivery order
**Question:** What sequence keeps delivery verifiable?

**Answer:** Build incrementally: (1) contracts/schemas/entity/PRNG/validation; (2) exploration/maps/events/saves/React/Phaser; (3) creatures/multiple battles/AI/progression; (4) breeding/transfer/audio/i18n; (5) full editor, CLI/bundler, and platform packaging.

**Context:** Each phase retains a playable reference example.

#### Q68 — Official package set
**Question:** Should a proposed initial package list be adopted?

**Answer:** Defer package definition.

**Context:** Final package names, boundaries, and responsibilities cannot yet be decided.

## Review checklist

- [x] The first release is a single-player vertical slice; multiplayer is excluded.
- [x] Terminology, examples, and assets remain original and franchise-neutral.
- [x] Persistent content is canonical JSON Schema-validated JSON.
- [x] Simulation is deterministic and supports reproducible saves and replays.
- [x] React owns UI and Phaser owns the 2D scene.
- [x] The editor covers the vertical-slice authoring flow and supports trusted custom panels.
- [x] Projects target web/PWA, Tauri desktop, and Capacitor mobile from one runtime.
- [x] Package decomposition remains deliberately open.

## Next step

Use this discovery record and `CONTEXT.md` to define bounded package responsibilities only when the project is ready to make that irreversible architectural decision.
