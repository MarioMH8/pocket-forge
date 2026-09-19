# Combat

Defines the neutral combat session model and the vocabulary through which authored rules and external resolution logic interact.

## Language

**Combat**:
An immutable battle-session orchestrator that owns participant composition, reproducibility state, and an `active` or `completed` lifecycle while delegating rule evaluation to a Combat Plugin.
_Avoid_: Battle engine, rules engine

**Combatant**:
A combat-local participant that carries a Creature snapshot and its own battle attributes.
_Avoid_: Creature, player

**Combatant Group**:
A named collection of Combatants with its own battle attributes; its cardinality and relationship to other groups are defined by the Combat Ruleset. Combatants may be added, removed, or moved only through a plugin-resolved Combat Transition.
_Avoid_: Team, side

**Combat Plugin**:
Reusable external rule logic that interprets a Combat Ruleset and resolves Combat transitions.
_Avoid_: Ruleset, battle configuration

**Combat Ruleset**:
Author-editable, attribute-validated configuration interpreted by a Combat Plugin to define a particular form of combat. It links Move identifiers to registered Combat Actions and their configuration.
_Avoid_: Plugin, battle configuration

**Combat Action**:
Plugin-registered executable logic selected by a Combat Ruleset for a Move. It receives an immutable combat context and returns a Combat Transition.
_Avoid_: Move function, embedded move logic

**Combat Transition**:
A plugin-resolved, immutable change from one Combat snapshot to its successor. Its input shape, phases, and semantics belong to the Combat Plugin.
_Avoid_: Turn, intent

**RandomPocket**:
The immutable deterministic random-state entity held by Combat and advanced as part of a resolved transition.
_Avoid_: Global RNG, random service
