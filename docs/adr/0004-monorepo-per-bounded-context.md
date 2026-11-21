# Use a Bun monorepo with one package per bounded context

Pocket Forge is structured as a Bun workspace monorepo. Each bounded context lives in its own package under `packages/<context>/` with independent `package.json`, `tsconfig.json`, and barrel-file exports. This keeps domain boundaries physically separated, enforces explicit dependency contracts through `peerDependencies`, and allows each context to evolve its own versioning and release cadence via Changesets.

Cross-context communication happens through domain events published on the shared `EventBus`, never through direct imports of another context's internals. Each package exposes only its `domain/` and `application/` layers; infrastructure and UI packages consume those contracts without coupling to implementation details.
