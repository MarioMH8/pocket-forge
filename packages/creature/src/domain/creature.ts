import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AbilityPrimitives } from '@pocket-forge/ability/domain';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { MovePrimitives } from '@pocket-forge/move/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';

/**
 * Primitives representation of a Creature snapshot.
 *
 * Mirrors the {@link Creature} shape but replaces embedded domain objects
 * (species, abilities, moves) and the internal {@link AttributeMap} of attributes
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
 * and its own set of validated attribute values (which may override or extend
 * the species defaults).
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * import { AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const hpDef = AttributeDefinition.create({
 *   key: 'currentHp', type: 'number', defaultValue: 10,
 *   constraints: { min: 0, max: 255 },
 * });
 *
 * const creature = Creature.create(
 *   'cr-001', 'Blaze',
 *   { id: 'sp-001', name: 'Pyrofox', description: '', attributes: { baseHp: 45 } },
 *   [], // abilities
 *   [], // moves
 *   { currentHp: 42 },
 *   [hpDef]
 * );
 * console.log(creature.attributes.value.currentHp); // 42
 * ```
 */
export default class Creature<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	/**
	 *Embedded ability snapshots known by this creature.
	 */
	readonly abilities: AbilityPrimitives[];
	/**
	 *Validated attribute values keyed by attribute name.
	 */
	readonly attributes: AttributeMap<T>;
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
		attributes: AttributeMap<T>,
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
	 * Creates a Creature with validated attribute values.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique creature identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param species - Primitives snapshot of the creature's species.
	 * @param abilities - Primitives snapshots of the creature's abilities.
	 * @param moves - Primitives snapshots of the creature's moves.
	 * @param values - Typed attribute values to assign to this creature.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Creature instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         value lacks a definition or fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		name: string,
		species: SpeciesPrimitives,
		abilities: AbilityPrimitives[],
		moves: MovePrimitives[],
		values: T,
		definitions: AttributeDefinition[]
	): Creature<T> {
		if (!id) {
			throw new InvalidArgumentError('Creature id is required', 'Creature');
		}
		if (!name) {
			throw new InvalidArgumentError('Creature name is required', 'Creature');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Creature');

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
	 * Serialises this Creature into a plain {@link CreaturePrimitives} object.
	 */
	toPrimitives(): CreaturePrimitives {
		return {
			abilities: this.abilities,
			attributes: this.attributes.toPrimitives(),
			id: this.id,
			moves: this.moves,
			name: this.name,
			species: this.species,
		};
	}
}
