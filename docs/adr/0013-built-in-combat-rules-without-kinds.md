# Built-in Combat rules without kinds

The built-in combat formats (`1v1`, `2v2`) and the threshold completion rule are Pocket Forge implementations, not authored content. They live in `@pocket-forge/combat` under a dedicated `./rulesets` entrypoint, so authors can import them directly or extend `CombatRuleset` without depending on a reference plugin. `./domain` stays format-free.

Rulesets and completion rules no longer declare a `kind` or an exact `contractVersion`, and there is no factory that dispatches by kind. A consumer imports the concrete class and calls its own `create`, which validates composition constraints and authored attributes against that class. This removes ceremony that had no consumer: static dispatch can be replaced by an import, and a ruleset version only mattered for hydrating serialized content whose kind was already known to the caller.

All extension identity and version compatibility is removed for now. Action plugins no longer declare a `contractVersion` or an `id`, action sets no longer declare a semver range or a plugin reference, and there is no `supports` check. Nothing consumed either, and the app chooses which plugin resolves which action set. Nothing ties a set to a plugin: a set whose action ids the wired plugin does not register fails when that plugin resolves it (the reference plugin rejects it as `invalid-action`).

This supersedes ADR-0008 and ADR-0010 wherever they describe ruleset kinds, factories, extension identity, or extension versioning.

## Considered Options

- **Keep kinds and factories in the core package**: preserves a single hydration path, but requires a registry with no current consumer and keeps format identifiers in the neutral domain.
- **Keep exact rule versions without factories**: reduces dispatch ceremony, but still asks callers to serialize and verify a version that no migration reads.
- **Built-in classes behind `./rulesets`, with no kinds or rule versions** (selected): the concrete class is the contract, callers construct what they import, the domain stays free of built-in formats, and extensions connect through the objects the app wires together rather than metadata ids.
- **Keep action plugin ids and versioning**: preserves a named extension identity and a range check between authored action sets and evolving plugins, but nothing consumes either today, and the app already chooses the pairing.

## Consequences

- Importing `@pocket-forge/combat/rulesets` is the supported way to use the built-in formats and the threshold completion rule.
- `CombatRuleset` and `CombatRulesetPrimitives` no longer carry an `id`; `CombatRulesetPrimitives` and `CombatCompletionRule` no longer carry `kind` or `contractVersion`; `CombatRulesetContract` is just `{ groupConstraints }`.
- `CombatRulesetFactory`, the reference factories, and their unknown-kind errors are gone.
- Serialized content no longer records a ruleset id, kind, rule version, plugin id, or plugin version. There is no identity or version check: the app wires a plugin and an action set, and a set whose action ids the plugin does not register fails at resolve (the reference plugin returns `invalid-action`).
- `CombatSetup.create` only wires the collaborators into an immutable setup; `CombatSetupError` and its compatibility check are gone.
- A registry becomes worthwhile again when serialized content or migrations must choose an implementation by identifier.
