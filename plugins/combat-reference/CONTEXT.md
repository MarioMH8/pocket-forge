# Combat Reference

Reference Combat action extensions that live outside the neutral core. Terms
here are specific to `@pocket-forge/combat-reference`; core Combat vocabulary
stays in `packages/combat/CONTEXT.md`.

## Language

**Reference Combat Action Plugin**:
A concrete Combat Action Plugin owned by this package that registers the Modify Attribute Action and resolves it into a Combat Transition.
_Avoid_: Core action resolver, engine plugin

**Modify Attribute Action**:
The reference action that sets, adds, or subtracts one declared attribute on a Combat, Combatant Group, or Combatant, optionally gated by one deterministic probability draw.
_Avoid_: Stat change, damage action

**Reference Combat Action Set**:
An authored set of Move-to-action bindings validated through the Reference Combat Action Plugin catalog.
_Avoid_: Core binding, hardcoded move

**Attribute Catalog**:
The project-level list of Attribute Definitions injected into the Reference Combat Action Plugin to validate and saturate target attributes.
_Avoid_: Attribute registry, stat table
