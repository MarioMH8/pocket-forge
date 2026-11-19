# Built-in Combat rules without kinds

The built-in combat formats (`1v1`, `2v2`) and the threshold completion rule are Pocket Forge implementations, not authored content. They live in `@pocket-forge/combat` under a dedicated `./rulesets` entrypoint, so authors can import them directly or extend `CombatRuleset` without depending on a reference plugin. `./domain` stays format-free.

Rulesets and completion rules no longer declare a `kind` or an exact `contractVersion`, and there is no factory that dispatches by kind. A consumer imports the concrete class and calls its own `create`, which validates composition constraints and authored attributes against that class. This removes ceremony that had no consumer: static dispatch can be replaced by an import, and a ruleset version only mattered for hydrating serialized content whose kind was already known to the caller.

All extension version compatibility is removed for now. Action plugins no longer declare a `contractVersion`, action sets no longer declare a semver range, and `supports` only matches the action set's plugin id against the plugin's id. Nothing consumed a range yet, and an id-only check is enough to reject a set wired to the wrong plugin.

This supersedes ADR-0008 and ADR-0010 wherever they describe ruleset kinds, factories, or extension versioning.

## Considered Options

- **Keep kinds and factories in the core package**: preserves a single hydration path, but requires a registry with no current consumer and keeps format identifiers in the neutral domain.
- **Keep exact rule versions without factories**: reduces dispatch ceremony, but still asks callers to serialize and verify a version that no migration reads.
- **Built-in classes behind `./rulesets`, with no kinds or rule versions** (selected): the concrete class is the contract, callers construct what they import, the domain stays free of built-in formats, and extensions are identified by id alone.
- **Keep action plugin versioning**: preserves a range check between authored action sets and evolving plugins, but nothing consumes ranges today and ids already reject mismatched wiring.

## Consequences

- Importing `@pocket-forge/combat/rulesets` is the supported way to use the built-in formats and the threshold completion rule.
- `CombatRulesetPrimitives`, `CombatRulesetContract`, and `CombatCompletionRule` no longer carry `kind` or `contractVersion`.
- `CombatRulesetFactory`, the reference factories, and their unknown-kind errors are gone.
- Serialized content no longer records a ruleset kind, rule version, or plugin version. There is no version compatibility check: an action set is accepted when it targets the plugin's `id`, and composition constraints and attributes are validated on their own.
- A registry becomes worthwhile again when serialized content or migrations must choose an implementation by identifier.
