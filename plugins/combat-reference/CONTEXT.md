# Combat Reference

Reference Combat extensions that live outside the neutral core. Terms here are
specific to `@pocket-forge/combat-reference`; core Combat vocabulary stays in
`packages/combat/CONTEXT.md`.

## Language

**Reference Combat Ruleset**:
A concrete Combat Ruleset owned by this package that fixes a combat format, its contract version, and its composition constraints so the neutral core never encodes a format.
_Avoid_: Core ruleset, built-in format

**Reference Combat Action Plugin**:
A concrete Combat Action Plugin owned by this package that registers the Modify Attribute Action and resolves it into a Combat Transition.
_Avoid_: Core action resolver, engine plugin

**Modify Attribute Action**:
The reference action that sets, adds, or subtracts one declared attribute on a Combat, Combatant Group, or Combatant, optionally gated by one deterministic probability draw.
_Avoid_: Stat change, damage action

**Reference Combat Action Set**:
An authored set of Move-to-action bindings validated through the Reference Combat Action Plugin catalog and a contract version port.
_Avoid_: Core binding, hardcoded move

**Attribute Catalog**:
The project-level list of Attribute Definitions injected into the Reference Combat Action Plugin to validate and saturate target attributes.
_Avoid_: Attribute registry, stat table

**Reference Combat Completion Rule**:
A concrete Combat Completion Rule owned by this package that reads authored `completion.*` ruleset attributes and returns a declarative Combat Outcome without resolving Moves or mutating Combat.
_Avoid_: Core victory check, turn resolver

**Threshold Completion Rule**:
The Reference Combat Completion Rule that ends Combat when a Combatant attribute satisfies a configured comparison against a threshold, under either the `threshold-group` or `opposing-group` winner policy.
_Avoid_: Hit-point check, knockout rule
