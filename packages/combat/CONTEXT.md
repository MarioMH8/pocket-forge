# Combat

Defines the neutral combat session model and the vocabulary through which authored rules and external resolution logic interact.

## Language

**Combat**:
A neutral orchestrator of participant composition, RandomPocket state, lifecycle, and transitions; it delegates action resolution and completion to external extensions through the Combat Engine.
_Avoid_: Battle engine, rules engine

**Combatant**:
A combat-local participant that carries a Creature snapshot and its own battle attributes.
_Avoid_: Creature, player

**Combatant Group**:
A named collection of Combatants with its own battle attributes; its cardinality and relationships are defined by the Combat Ruleset, and composition changes happen only through resolved Combat Transitions.
_Avoid_: Team, side

**Combat Action Plugin**:
Reusable external logic that registers actions and resolves Move-bound actions into Combat Transitions.
_Avoid_: Combat Plugin, rules engine, embedded move logic

**Combat Ruleset**:
A concrete combat format that declares its `kind`, `contractVersion`, format attributes, and composition constraints. It does not contain Move bindings, action logic, or victory logic.
_Avoid_: Plugin, battle configuration, embedded ruleset

**Combat Ruleset Kind**:
The stable identifier of a concrete Combat Ruleset implementation.
_Avoid_: Format name, ruleset class

**Combat Action**:
Plugin-registered executable logic selected by a Combat Action Set for a Move; it receives an immutable context and returns a Combat Transition.
_Avoid_: Move function, embedded move logic

**Combat Action Set**:
Authored data binding Move identifiers to registered Combat Actions and serializable action configuration.
_Avoid_: Core binding, hardcoded move

**Combat Completion Rule**:
An external rule that inspects a Combat snapshot and returns a Combat Outcome when combat should end.
_Avoid_: Core victory check, turn resolver

**Combat Engine**:
A pure orchestrator that composes a ruleset, action plugin, action set, and completion rule; it validates composition, delegates resolution, and evaluates completion.
_Avoid_: Game loop, battle manager

**Combat Transition**:
A resolved immutable change from one Combat snapshot to its successor, carrying ordered serializable events.
_Avoid_: Turn, intent

**Combat Event**:
An ordered serializable event emitted by a resolved transition; Combat does not retain history.
_Avoid_: Log entry, domain event

**Combat Outcome**:
The terminal result of a Combat: victory with a winning group, or a draw.
_Avoid_: Victory check, score

**RandomPocket**:
The immutable deterministic random-state entity held by Combat and advanced as part of a resolved transition.
_Avoid_: Global RNG, random service
