# Duelmon

Duelmon Combat action extensions that live outside the neutral core. Terms
here are specific to `@pocket-forge/duelmon`; core Combat vocabulary stays in
`packages/combat/CONTEXT.md`.

## Language

**Duelmon Combat Plugin**:
A concrete Combat Action Plugin owned by this package that registers the Modify Attribute Action and resolves it into a Combat Transition. It has no plugin id or `supports` check; the app wires it with an action set.
_Avoid_: Core action resolver, engine plugin

**Modify Attribute Action**:
The Duelmon action that sets, adds, or subtracts one declared attribute on a Combat, Combatant Group, or Combatant, optionally gated by one deterministic probability draw.
_Avoid_: Stat change, damage action

**Attribute Catalog**:
The project-level list of Attribute Definitions injected into the Duelmon Combat Plugin to validate and saturate target attributes.
_Avoid_: Attribute registry, stat table
