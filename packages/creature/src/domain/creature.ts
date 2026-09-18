import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AbilityPrimitives } from '@pocket-forge/ability/domain';
import type {
	AttributeAssignment,
	AttributeDefinition,
	AttributeValue,
	AttributeValues,
} from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { MovePrimitives } from '@pocket-forge/move/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';

/**
 * Primitives representation of a Creature snapshot.
 *
 * Mirrors the {@link Creature} shape but replaces embedded domain objects
 * (species, abilities, moves) and the internal `ReadonlyMap` of attributes
 * with their plain primitives equivalents for serialisation and persistence.
 */
export interface CreaturePrimitives extends Omit<
	Primitives<Creature>,
	'abilities' | 'attributes' | 'moves' | 'species'
> {
	readonly abilities: AbilityPrimitives[];
	readonly attributes: AttributeValues;
	readonly moves: MovePrimitives[];
	readonly species: SpeciesPrimitives;
}

/**
 * An immutable creature instance with embedded species, ability, and move snapshots.
 *
 * A Creature represents an individual creature owned by a player within a
 * {@link GameSession}. It carries a reference to its {@link SpeciesPrimitives species},
 * a list of {@link AbilityPrimitives abilities} and {@link MovePrimitives moves},
 * and its own set of validated {@link AttributeAssignment} values (which may
 * override or extend the species defaults).
 *
 * @example
 * ```ts
 * import { AttributeAssignment, AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const hpDef = AttributeDefinition.create({
 *   key: 'currentHp', type: 'number', defaultValue: 10,
 *   constraints: { min: 0, max: 255 },
 * });
 * const hpAssignment = AttributeAssignment.create({ key: 'currentHp', value: 42 }, hpDef);
 *
 * const creature = Creature.create(
 *   'cr-001', 'Blaze',
 *   { id: 'sp-001', name: 'Pyrofox', description: '', attributes: { baseHp: 45 } },
 *   [], // abilities
 *   [], // moves
 *   [hpAssignment],
 *   [hpDef]
 * );
 * console.log(creature.getAttribute('currentHp')); // 42
 * ```
 */
export default class Creature {
	/**
	 *Embedded ability snapshots known by this creature.
	 */
	readonly abilities: AbilityPrimitives[];
	/**
	 *Validated attribute assignments keyed by attribute name.
	 */
	readonly attributes: ReadonlyMap<string, AttributeAssignment>;
	/**
	 *Unique identifier for this creature instance.
	 */
	readonly id: string;
	/**
	 *Embedded move snapshots known by this creature.
	 */
	readonly moves: MovePrimitives[];
	/**
	 *Display name (may differ from the species name).
	 */
	readonly name: string;
	/**
	 *The species this creature belongs to (as a primitives snapshot).
	 */
	readonly species: SpeciesPrimitives;

	private constructor(
		abilities: AbilityPrimitives[],
		attributes: ReadonlyMap<string, AttributeAssignment>,
		id: string,
		moves: MovePrimitives[],
		name: string,
		species: SpeciesPrimitives
	) {
		this.abilities = abilities;
		this.attributes = attributes;
		this.id = id;
		this.moves = moves;
		this.name = name;
		this.species = species;
	}

	/**
	 * Creates a Creature with validated attribute assignments.
	 *
	 * Every assignment in `assignments` must have a matching entry in
	 * `definitions`, and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique creature identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param species - Primitives snapshot of the creature's species.
	 * @param abilities - Primitives snapshots of the creature's abilities.
	 * @param moves - Primitives snapshots of the creature's moves.
	 * @param assignments - Attribute values to assign to this creature.
	 * @param definitions - Attribute definitions that govern the assignments.
	 * @returns A fully validated Creature instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         assignment lacks a definition or fails validation.
	 */
	static create(
		id: string,
		name: string,
		species: SpeciesPrimitives,
		abilities: AbilityPrimitives[],
		moves: MovePrimitives[],
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[]
	): Creature {
		if (!id) {
			throw new InvalidArgumentError('Creature id is required', 'Creature');
		}
		if (!name) {
			throw new InvalidArgumentError('Creature name is required', 'Creature');
		}

		const attributeMap = AttributeMap.validateAndBuildAttributeMap(assignments, definitions, 'Creature');

		return new Creature(abilities, attributeMap, id, moves, name, species);
	}

	/**
	 * Hydrates a Creature from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing a Creature from a persistence layer where
	 * the data was already validated at write time.
	 *
	 * @param primitives - A {@link CreaturePrimitives} snapshot.
	 * @returns A rehydrated Creature instance.
	 */
	static fromPrimitives(primitives: CreaturePrimitives): Creature {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Creature(
			primitives.abilities,
			attributeMap,
			primitives.id,
			primitives.moves,
			primitives.name,
			primitives.species
		);
	}

	/**
	 * Returns the value of a specific attribute, or `undefined` if not set.
	 *
	 * @param key - The attribute key to look up (e.g. `'currentHp'`).
	 * @returns The attribute's current value, or `undefined`.
	 */
	getAttribute(key: string): AttributeValue | undefined {
		return this.attributes.get(key)?.value;
	}

	/**
	 * Serialises this Creature into a plain {@link CreaturePrimitives} object.
	 */
	toPrimitives(): CreaturePrimitives {
		return {
			abilities: this.abilities,
			attributes: AttributeMap.toPrimitives(this.attributes),
			id: this.id,
			moves: this.moves,
			name: this.name,
			species: this.species,
		};
	}
}
