# Built-in Combat rules without kinds

The built-in combat formats (`1v1`, `2v2`) and the threshold completion rule are Pocket Forge implementations, not authored content. They live in `@pocket-forge/combat` under a dedicated `./rulesets` entrypoint, so authors can import them directly or extend `CombatRuleset` without depending on a reference plugin. `./domain` stays format-free.

Rulesets and completion rules no longer declare a `kind` or an exact `contractVersion`, and there is no factory that dispatches by kind. A consumer imports the concrete class and calls its own `create`, which validates composition constraints and authored attributes against that class. This removes ceremony that had no consumer: static dispatch can be replaced by an import, and a ruleset version only mattered for hydrating serialized content whose kind was already known to the caller.

Action plugins and action sets keep their independent versioning (ADR-0010). A plugin still declares an exact `contractVersion`, authored action sets still declare a semver range, and `ContractVersionValidator` still checks `supports` ranges. That mechanism protects a different boundary: authored Move bindings are portable content that can target multiple plugin releases.

This supersedes the ruleset and completion-rule parts of ADR-0008 and ADR-0010.

## Considered Options

- **Keep kinds and factories in the core package**: preserves a single hydration path, but requires a registry with no current consumer and keeps format identifiers in the neutral domain.
- **Keep exact rule versions without factories**: reduces dispatch ceremony, but still asks callers to serialize and verify a version that no migration reads.
- **Built-in classes behind `./rulesets`, with no kinds or rule versions** (selected): the concrete class is the contract, callers construct what they import, and the domain stays free of built-in formats.
- **Remove action plugin versioning too**: simpler on paper, but drops the only compatibility check between authored action sets and evolving plugins.

## Consequences

- Importing `@pocket-forge/combat/rulesets` is the supported way to use the built-in formats and the threshold completion rule.
- `CombatRulesetPrimitives`, `CombatRulesetContract`, and `CombatCompletionRule` no longer carry `kind` or `contractVersion`.
- `CombatRulesetFactory`, the reference factories, and their unknown-kind errors are gone.
- Serialized content no longer records a ruleset kind or rule version; compatibility is checked through composition constraints, attributes, and the action set's plugin range.
- A registry becomes worthwhile again when serialized content or migrations must choose an implementation by identifier.
