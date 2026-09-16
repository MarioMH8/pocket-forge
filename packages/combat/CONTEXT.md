# Combat

A deterministic, turn-based simulation context for resolving configured teams, decisions, and rules to an outcome.

## Language

**Combat**:
An immutable autonomous simulation from configured initial Teams and Rules through Turn decisions to a terminal Outcome. Its transitions produce a successor Combat and Events without exposing mutable state.
_Avoid_: Battle, match, encounter

**Team**:
One side of a Combat, comprising one or more Creatures under a single Controller.
_Avoid_: Party, squad

**Creature**:
A member of a Team whose configured capabilities and current condition can affect a Combat; one Creature per Team is active in the first model.
_Avoid_: Combatant, character, unit

**Controller**:
The decision source for a Team during a Combat.
_Avoid_: Player, trainer, opponent

**Condition**:
The mutable, authoritative state of a Creature during a Combat, including its current vitality and applicable effects.
_Avoid_: Status, health

**Defeated**:
The condition of a Creature whose vitality is zero and which is no longer eligible to act or become active.
_Avoid_: Fainted, knocked out

**Turn**:
One resolution cycle in which every eligible Controller supplies an Intent and the Combat applies its rules to produce Events.
_Avoid_: Round, phase

**Intent**:
A Controller's requested decision for its Team in a Turn; it can become invalid before resolution.
_Avoid_: Move, command

**Movement**:
A configured capability that an active Creature may be the subject of through an Intent.
_Avoid_: Action, move, attack, skill

**Event**:
An immutable authoritative fact emitted while a Combat resolves an Intent or rule.
_Avoid_: Log entry, message

**Turn Input**:
The complete set of one Intent from every eligible Controller that a Combat accepts atomically for a Turn.
_Avoid_: Command batch, request

**Resolution Order**:
The total stable ordering of valid Intents in a Turn: Movement priority, then the Attribute selected by Rules, then a stable identity tie-breaker.
_Avoid_: Speed order, initiative roll

**Seed**:
The explicit initial value from which a Combat derives its authoritative deterministic random sequence.
_Avoid_: Random seed, entropy

**Combat Record**:
The replayable history of a Combat: its initial context, Content Identity, accepted Turn Inputs, and ordered Events. Replay rejects a resolved package whose identity does not match exactly before processing Inputs or RNG.
_Avoid_: Log, transcript

**Invalidation**:
The recorded outcome in which a valid Intent cannot resolve because its requirements cease to hold during its Turn.
_Avoid_: Failed move, cancellation

**Outcome**:
The explicit terminal result of a Combat, declaring a winning Team, a draw, or an abort under its rules.
_Avoid_: Result, winner

**Replacement**:
A Controller's between-Turn selection of an eligible reserve Creature to become active after its former active Creature is Defeated.
_Avoid_: Switch, substitution

## Content

**Combat Content Package**:
A versioned collection of declarative combat content, identified by a manifest that coordinates its separate documents.
_Avoid_: Mod, format, ruleset

**Manifest**:
The versioned entry document that identifies a Combat Content Package and the documents it contains.
_Avoid_: Configuration file, index

**Content Identity**:
The stable package identifier, immutable opaque content version, SHA-256 digest of Resolved Content, and digest-serialization scheme version used to identify the configuration of a Combat. Compatibility depends only on Contract Version.
_Avoid_: Save version, format version

**Contract Version**:
The version of the declarative contract against which a Combat Content Package is validated. The engine or validator publishes whether each version is supported, deprecated, or unsupported and its successor. Unsupported versions are rejected; a caller must explicitly migrate content outside the Combat engine.
_Avoid_: Content version, engine version

**Migration Provenance**:
Optional Content Identity metadata in a new immutable content version that records the exact package version from which an external migration produced it.
_Avoid_: Auto-upgrade, conversion history

**Blueprint**:
A reusable declarative definition in a Combat Content Package from which a Creature's configured capabilities are drawn.
_Avoid_: Template, species, character sheet

**Rules**:
The declarative configuration in a Combat Content Package that governs how a Combat is resolved and terminated.
_Avoid_: Ruleset, game mode

**Resolved Content**:
The immutable, fully validated interpretation of a Combat Content Package that may initialize a Combat. Its Content Identity includes the SHA-256 digest of its versioned canonical serialization, rather than source-document bytes.
_Avoid_: Loaded data, compiled content

**Attribute**:
A named numeric property declared with an inclusive allowed range by a Combat Content Package and used by its Rules or Movements. Attribute changes saturate at that range.
_Avoid_: Stat, parameter

**Diagnostic**:
A structured report from content validation, identifying its severity, document, JSON path, stable code, and explanation. Errors reject a package; warnings, such as `contract-version-deprecated`, may accompany valid Resolved Content. Unsupported contract versions use the `contract-version-unsupported` error.
_Avoid_: Error message, warning

## Effects

**Effect**:
One declarative, ordered operation evaluated by the Combat engine while resolving an Movement.
_Avoid_: Script, callback, ability logic

**Mark**:
A named persistent fact declared in a Combat Content Package's Mark catalog and applied to a Creature's Condition by an Effect. In the first model it is present or absent only, with no duration or attached values.
_Avoid_: Status effect, buff, debuff

**Target**:
The resolved Creature addressed by an Movement: its actor or the active Creature of the opposing Team in the first model.
_Avoid_: Recipient, opponent

**Predicate**:
A closed, composable declarative test over the actor's or Target's Marks or Attributes that determines whether an Effect branch applies. Its atomic checks are Mark presence and `equals`, `greater-than`, `greater-or-equal`, `less-than`, or `less-or-equal` comparisons to an integer; `all` and `any` groups cannot be empty.
_Avoid_: Expression, rule script

**Effect Limit**:
A Contract Version's maximum of 64 authored Effect nodes per Movement and branch nesting depth of eight; a package exceeding either limit is invalid.
_Avoid_: Runtime timeout, quota

**Effect Resolution Event**:
The Event produced for every evaluated Effect, identifying its kind, target, and `applied`, `skipped`, or `no-op` result.
_Avoid_: Debug log, trace

**Probability Branch**:
An Effect that selects an ordered branch using a validated integer fraction. It draws uniformly from `0..denominator-1` exactly once and selects success when the draw is below `numerator`; certain `0/d` and `d/d` branches draw nothing.
_Avoid_: Random callback, chance script

**Amount**:
A non-negative integer literal or direct Attribute reading from the actor or Target, used by an Effect with an explicit `add` or `subtract` operation. A referenced Attribute must declare a non-negative minimum.
_Avoid_: Formula, expression
