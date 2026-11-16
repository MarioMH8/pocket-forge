# Separate combat format, action logic, and completion

Combat must support customizable battle rules without embedding a particular format, Move implementation, or victory condition in the neutral core. We split the model into four collaborating pieces: `CombatRuleset` describes an abstract format (identity, `kind`, exact `contractVersion`, format attributes, and composition constraints) and contains no Move bindings, actions, or outcome logic; `CombatActionPlugin` registers and resolves Move-bound actions; `CombatActionSet` is authored Move-to-action data with serializable configuration; and `CombatCompletionRule` inspects a Combat snapshot and decides the outcome. `CombatEngine` composes those four pieces, validates their contracts, delegates resolution, and evaluates completion, while `Combat` remains a neutral immutable state holder. Concrete rulesets, action plugins, and completion rules live outside the core; `plugins/combat-reference` is the reference implementation.

## Considered Options

- **Monolithic ruleset that binds Moves to actions and owns victory**: simplest to start, but couples format, rules, and completion in one authored object and forces every new format to duplicate or subclass shared logic.
- **Single plugin that owns format, actions, and completion**: flexible internally, but hides the authored boundaries, makes validation opaque, and prevents independently versioned extensions.
- **Hard-coded core formats**: fastest for a fixed game, but violates the neutral, author-defined ruleset goal and makes the toolkit unusable for other combat designs.
- **Separate format, action logic, and completion composed by an engine** (selected): keeps each extension focused, makes authored data explicit, and lets the engine enforce the shared invariants once.

## Consequences

- Extensions compose per combat: a format can be paired with different action plugins, action sets, and completion rules.
- The core stays neutral and holds no format, Move, or victory knowledge.
- Contracts become more explicit: rulesets, plugins, and completion rules each declare their identity and version, and action sets declare serializable bindings.
- The engine owns orchestration and uniform validation, so concrete extensions do not repeat composition and transition checks.
- External packages provide implementations, with `plugins/combat-reference` proving the model end to end.
- Configuration shape and compatibility need their own rules, documented in ADR-0009 and ADR-0010.
