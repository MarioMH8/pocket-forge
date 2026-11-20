# Combat

Defines the neutral combat session model and the vocabulary through which authored rules and external resolution logic interact.

The context spans two packages: `@pocket-forge/combat` holds the neutral state (Combat, Combatant, Combatant Group), and `@pocket-forge/combat-engine` holds the Combat Engine and the extension contracts (rule, hooks, action resolver, action binding set, transition, event, outcome).

## Language

**Combat**:
The immutable, serializable state of one combat: participant composition, RandomPocket state, battle attributes, and active/completed lifecycle. It advances only through validated Combat Transitions; action resolution and turn ordering belong to the Combat Engine and concrete action services.
_Avoid_: Battle aggregate, Battle engine, rules engine

**Combatant**:
A combat-local participant that carries a Creature snapshot and its own battle attributes.
_Avoid_: Creature, player

**Combatant Group**:
A collection of Combatants on one side of a combat with its own battle attributes; it may contain reserve Combatants and up to two Active Combatants. Its cardinality and relationships are defined by the Combat Rules, and composition changes happen only through resolved Combat Transitions.
_Avoid_: Team, side, party

**Active Combatant**:
A Combatant in a Combatant Group that is currently in play. The active subset is battle state, not composition; a group may have up to two active Combatants.
_Avoid_: Team member, front-line creature

**Combat Rule**:
An authored, serializable rule with its own configuration that participates in a Combat through one or more hooks. The concrete class is the identity. A Combat may compose several rules; each rule implements the hooks it cares about.
_Avoid_: Plugin, battle configuration, format singleton

**Combat Composition Hook**:
The rule hook that validates which groups and combatants a Combat accepts. It never resolves actions or decides the outcome.
_Avoid_: Formation check, team validator

**Combat Completion Hook**:
The rule hook that inspects a Combat snapshot and returns a Combat Outcome when combat should end. It never mutates the Combat.
_Avoid_: Core victory check, turn resolver

**Combat Action Resolver**:
Reusable external logic that owns an action catalog and resolves Move-bound actions into Combat Transitions; the object itself is the identity, with no separate resolver id.
_Avoid_: rules engine, embedded move logic

**Combat Action**:
Resolver-registered executable logic selected by a Combat Action Binding Set for a Move; it receives an immutable context and returns a Combat Transition.
_Avoid_: Move function, embedded move logic

**Combat Action Binding Set**:
Authored data binding Move identifiers to registered Combat Actions and serializable action configuration; it carries no resolver reference, so the app pairs it with the resolver that executes it.
_Avoid_: Core binding, hardcoded move

**Built-in Combat Rules**:
The rule implementations shipped by `@pocket-forge/combat-engine` under `./rules`. Authors import them directly or extend `CombatRule` with their own rule.
_Avoid_: Reference rules, default plugin

**Threshold Combat Completion Rule**:
The built-in completion rule that ends Combat when a Combatant attribute satisfies a configured comparison against a threshold, under a configured winner policy.
_Avoid_: Hit-point check, knockout rule

**Combat Engine**:
A pure orchestrator that composes Combat Rules, an action resolver, and an action binding set; it validates composition, delegates resolution of one action at a time, evaluates completion hooks, and requires agreeing outcomes. Turn ordering, switching, and residual effects live in concrete action services outside the engine. It lives in `@pocket-forge/combat-engine`.
_Avoid_: Game loop, battle manager, turn engine

**Combat Turn**:
The ordered resolution of the actions declared for one turn. A concrete action service orders the actions, calls the Combat Engine for each one, and stops when combat completes; the engine itself resolves one action at a time.
_Avoid_: Game loop, round

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
