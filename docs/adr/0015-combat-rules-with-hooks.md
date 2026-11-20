# Combat rules with hooks

> **Refines [ADR-0008](./0008-separate-combat-format-actions-and-completion.md) and [ADR-0013](./0013-built-in-combat-rules-without-kinds.md): the format and completion rules become one `CombatRule` concept that participates through hooks; action plugins and action sets are renamed to action resolvers and Move binding sets.**

The Combat Engine had two separate rule concepts: `CombatRuleset` (a format that validated composition and carried format attributes) and `CombatCompletionRule` (a rule that decided the outcome). Both are authored, serializable rules with their own configuration, and both participate in a combat at a specific moment. Keeping two names forced authors to learn two contracts and made the engine's collaboration surface larger than the concepts it represents.

A Combat Rule is an authored, serializable rule with its own configuration. The concrete class is the identity. A rule participates through typed hooks: a composition hook validates the combat's groups and combatants, and a completion hook inspects the combat and returns an outcome. A Combat may compose several rules; each rule implements the hooks it cares about. The engine filters rules by hook and runs the matching pipeline step.

The action plugin and action set are renamed to `CombatActionResolver` and `CombatMoveBindingSet` to match what they do: the resolver owns an action catalog and executes bound actions; the binding set is authored data that binds Move identifiers to registered actions and configuration. The two remain separate from rules because actions are per-Move behavior while rules are format and victory policy.

This changes the engine composition: `CombatSetup` now carries `rules`, `actions`, and `moveBindings`. When more than one completion hook returns an outcome, the engine requires the outcomes to agree; conflicting outcomes are rejected as `conflicting-outcome` rather than resolved by order. The built-in rules move to `@pocket-forge/combat-engine/rules`.

## Considered Options

- **Keep separate `CombatRuleset` and `CombatCompletionRule`**: familiar and already tested, but keeps two names for the same authored-rule concept and cannot compose several rules without adding a second list.
- **One `CombatRule` interface with optional methods**: minimal surface, but optional methods force runtime checks and make it unclear which hook a rule participates in.
- **One `CombatRule` base with typed hook contracts** (selected): a rule extends the base and implements the hooks it needs; the engine filters by hook, so adding a hook is a conscious pipeline change and concrete rules stay type-safe.
- **Fold actions into the rule contract**: fewer concepts, but mixes per-Move behavior with format and victory policy and makes the engine depend on action dispatch.

## Consequences

- `CombatRule` carries its own `attributes` and `definitions`; concrete rules extend it and implement `CombatCompositionHook` and/or `CombatCompletionHook`.
- `CombatCompositionRule` is the base for composition rules; it owns `groupConstraints` and implements the composition hook. It lives in `./rules`, not in `./domain`: the domain keeps the engine contracts (`CombatRule`, `CombatCompositionHook`, `CombatCompletionHook`, and the hook type guards) while concrete rules and their helpers live in `./rules`. Built-in rules are grouped into `rules/composition` and `rules/completion`.
- `CombatSetup` is `{ rules, actions, moveBindings }`. `CombatEngine` validates composition by running every composition hook, evaluates every completion hook after the action resolves, and requires agreeing outcomes.
- `CombatActionResolver` replaces `CombatActionPlugin`; `CombatMoveBindingSet` replaces `CombatActionSet`; the `CombatMoveBinding` row keeps its name.
- The built-in `OneVersusOneCombatRule`, `TwoVersusTwoCombatRule`, and `ThresholdCombatCompletionRule` live under `@pocket-forge/combat-engine/rules`.
- `@pocket-forge/combat-engine/rulesets` is removed; importers move to `./rules`.
- A new hook is a deliberate change to the engine pipeline, not a dynamic registration. A registry becomes worthwhile when serialized content must choose a rule by identifier.
