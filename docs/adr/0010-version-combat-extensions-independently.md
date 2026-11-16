# Version Combat extensions independently

Combat must accept third-party rulesets, action plugins, action sets, and completion rules that evolve on their own schedules. Each ruleset and completion rule declares a `kind` plus an exact `contractVersion`; each action plugin declares an `id` plus an exact `contractVersion`; authored action sets declare a semver range of plugin versions they accept. Factories reject unknown kinds, incompatible versions, and serialized data that does not match the declared constraints. The domain depends on `ContractVersionValidator` as a port, while semver lives only in infrastructure (`SemverContractVersionValidator`); `semver` is an optional peer dependency of the core package, and the reference package only consumes the port.

## Considered Options

- **One global contract version for every extension**: simple to reason about, but forces unrelated formats and plugins to release together and makes partial adoption impossible.
- **No explicit versions**: least ceremony, but incompatible serialized content fails late with opaque errors and cannot be migrated safely.
- **Major-only compatibility checks**: reduces breakage noise, but hides meaningful contract changes and cannot express the exact expectations of a concrete factory.
- **Independent versioning with exact extension versions and ranged authored content** (selected): each implementation owns its compatibility promise, and authored content declares the range it targets.

## Consequences

- Rulesets, plugins, and completion rules evolve independently without coordinating releases across packages.
- Incompatible combinations fail explicitly at composition time with structured errors instead of at runtime mid-combat.
- Authored action sets remain portable across compatible plugin releases through their declared range.
- v1 uses exact matching for implementation contracts; range satisfaction is reserved for authored content.
- Future compatibility work includes migrations for serialized data and broader range policies as the extension ecosystem grows.
