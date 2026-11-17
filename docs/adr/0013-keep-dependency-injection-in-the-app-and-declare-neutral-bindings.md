# Keep dependency injection in the app and declare capabilities as neutral bindings

A project must be able to replace any minimal part of the game with its own implementation without the core depending on a DI container. Every replaceable part is a **capability**: a port expressed as an abstract class in the owning context. A Pack declares **bindings** — `{ capability, create(content) }` — in its `./pack` module; it never names a container, a token string, or another service. The resolver merges bindings in pack order, where a later Pack shadows an earlier binding for the same capability and the shadowing is recorded in the `GameDefinition` provenance; it then applies the project's own `bindings` and content `overrides`. Bindings are loaded through a generated `packs.generated.ts`, so the config stays data while the app gets static imports. The DI container is an implementation detail of the app: the template may ship a minimal one, and each project may use inversify, DIOD, or plain functions.

## Considered Options

- **Packs export `register(container, options)`**: the container leaks into the Pack's interface, and the Pack can no longer stay agnostic to how a project wires itself.
- **Dynamic `import(name + '/pack')`**: no generation step, but no types, no autocompletion, and errors only at runtime.
- **Binding factories receive a resolver (`deps.get(capability)`)**: convenient for complex graphs, but the Pack ends up reimplementing a container through the back door.
- **A binding conflict is an error**: predictable, but it forbids layering (base Pack plus theme Pack), which is the point of grouping bindings.
- **No bindings; the project chooses every implementation**: maximum decoupling, but the Pack stops grouping dependencies and every project repeats the wiring.

## Consequences

- The core has no DI dependency and no container package; the container library choice is deferred and is not part of the public contract.
- A capability is an abstract class so it can key a map at runtime; a pure interface uses a branded token.
- A binding factory receives the resolved `Content Index`; any other dependency is supplied by the project's own binding.
- Two Packs binding the same capability resolve deterministically, and the editor can show which binding was shadowed.
- Content and binding conflicts diverge on purpose: a duplicated content id is two claims about the same entity, so resolution fails and needs an explicit override; two bindings for one capability are two candidates for the same post, so the later Pack wins and the shadowed binding is recorded.
- Subsystems expose pure setup functions (`combatSetup(definition)`) instead of registering themselves; they also validate their own cross-catalog references when they run.
