# Use Starlight + TypeDoc + GitHub Pages for project documentation

Pocket Forge needs a documentation site that serves hand-written guides, a unified domain glossary, and
auto-generated API reference from JSDoc. We chose **Starlight** (Astro) as the static-site framework,
**TypeDoc** with `typedoc-plugin-markdown` for per-package API generation, and **GitHub Pages** for hosting.

## Considered Options

- **VitePress**: more flexible and generic, but requires more configuration for multi-section navigation.
  Starlight ships with sidebar, search, dark mode, and multi-section layout out of the box.
- **Docusaurus**: heavier runtime (React), slower builds, and overkill for a library documentation site.
- **TypeDoc HTML output embedded via iframe**: simpler setup but breaks Starlight's built-in search and
  creates a disjointed reading experience. Generating Markdown keeps API docs as first-class Starlight pages.

## Consequences

- The documentation site lives in `apps/docs/` as a separate workspace package, keeping tooling isolated
  from the existing `docs/` directory (which remains for ADRs and agent guides).
- Each package generates its own API docs independently via TypeDoc, matching the per-bounded-context
  architecture of the monorepo.
- A build-time script extracts and unifies all `CONTEXT.md` glossaries into a single glossary page.
- GitHub Pages deployment is automated via a CI workflow triggered on pushes to `main`.
