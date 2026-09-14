# Pocket Forge

Pocket Forge is a toolkit and visual authoring environment for original, creature-collection role-playing games. It gives mixed teams a shared language for game content, simulation, and authoring without reproducing another franchise’s terminology or rules.

## Project Content

**Game Project**:
A complete, author-owned game definition: its content, assets, extensions, locales, and configuration.
_Avoid_: Game, app, project folder

**Content**:
The versioned declarative definitions that describe a Game Project’s world and rules.
_Avoid_: Game data, configuration, database

**Content Identifier**:
A stable, namespaced slug that identifies a content definition across references and migrations.
_Avoid_: Name, key, UUID

**Asset**:
A local, packaged resource identified from Content, such as a sprite, tileset, sound, or font.
_Avoid_: Resource, file reference

**Locale**:
A named language and regional variant with a catalog that resolves the Game Project’s text keys.
_Avoid_: Language, translation file

## World

**Map**:
An orthogonal, tile-based playable area composed of ordered layers, collision information, zones, and placements.
_Avoid_: Level, scene, board

**Zone**:
A defined region of a Map that changes exploration rules, such as encounter availability.
_Avoid_: Area, biome, region

**Event**:
A deterministic graph of authored game instructions that advances in response to a trigger or game condition.
_Avoid_: Script, cutscene, quest

**Event Node**:
One instruction or control-flow decision in an Event graph.
_Avoid_: Command, block

**Player**:
The persistent game-world actor controlled by a person, including its position, inventory, party, and progression.
_Avoid_: User, trainer, avatar

**Inventory**:
The persistent collection of item instances held by a Player.
_Avoid_: Bag, storage

## Creatures and Combat

**Creature**:
An individual collectable game entity with a species definition, traits, progression, and battle state.
_Avoid_: Monster, pet, Pokémon

**Species**:
The reusable content definition from which individual Creatures derive their base rules and presentation.
_Avoid_: Creature type, breed

**Dex**:
A Game Project’s catalog of discoverable Species and their recorded knowledge.
_Avoid_: Bestiary, Pokédex

**Party**:
The ordered, active collection of Creatures available to a Player or opposing side.
_Avoid_: Team, squad

**Roster**:
The wider collection of owned Creatures outside the active Party.
_Avoid_: Box, storage party

**Encounter**:
A rule-governed transition from exploration into a potential interaction with one or more Creatures.
_Avoid_: Random battle, wild battle

**Battle**:
A turn-based contest between sides, with up to two active Combatants per side in the first release.
_Avoid_: Fight, match, combat

**Combatant**:
A Creature currently participating in a Battle.
_Avoid_: Fighter, battler

**Action**:
A selectable Battle capability with declared targeting and effects.
_Avoid_: Move, skill, attack

**Affinity**:
A game-defined category used by rules such as Action effectiveness and Creature traits.
_Avoid_: Type, element

**Recruitment**:
The rule-governed addition of a Creature to an owner’s Roster.
_Avoid_: Catching, capture

**Transformation**:
A rule-governed change to a Creature’s Species or traits.
_Avoid_: Evolution, metamorphosis

**Breeding**:
A game-defined process that produces a new Creature from compatible parents and inheritance rules.
_Avoid_: Day care, egg system

**Transfer**:
An offline, validated movement of a Creature between compatible Game Project saves.
_Avoid_: Trade, exchange

## Simulation

**Game Session**:
A running simulation of a Game Project from a particular persistent state.
_Avoid_: Playthrough, runtime

**Command**:
An intentional, validated request to advance a Game Session’s state.
_Avoid_: Input, action event

**Domain Event**:
An immutable record that describes a state transition accepted by the simulation.
_Avoid_: Callback, notification, log

**Seed**:
The explicit starting value that makes a Game Session’s pseudo-random outcomes reproducible.
_Avoid_: Random seed, RNG state

**Save Snapshot**:
A versioned, serializable representation of persistent Game Session state.
_Avoid_: Save file, checkpoint

**Replay**:
A reproducible reconstruction of a Game Session from a Save Snapshot, Seed, and accepted Commands.
_Avoid_: Recording, playback
