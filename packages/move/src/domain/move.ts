import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

/**
 * Primitives representation of a Move snapshot.
 *
 * Mirrors the {@link Move} shape but replaces the internal
 * {@link AttributeMap} of attributes with a plain {@link AttributeValues} record
 * suitable for serialisation and persistence.
 */
export interface MovePrimitives extends Primitives<Omit<Move, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature move.
 *
 * Each move carries a set of validated attribute values that define
 * its gameplay properties — power, accuracy, type affinity, energy cost,
 * etc. Moves are created through the {@link Move.create} factory, which
 * validates all values against their corresponding
 * {@link AttributeDefinition}s.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * import { AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const powerDef = AttributeDefinition.create({
 *   key: 'power', type: 'number', defaultValue: 0,
 *   constraints: { min: 0, max: 250 },
 * });
 *
 * const move = Move.create(
 *   'mv-001', 'Flame Burst', 'A concentrated blast of fire.',
 *   { power: 90 },
 *   [powerDef]
 * );
 * console.log(move.attributes.value.power); // 90
 * ```
 */
export default class Move<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	/**
	 *Validated attribute values keyed by attribute name.
	 */
	readonly attributes: AttributeMap<T>;
	/**
	 *Human-readable flavour or lore text.
	 */
	readonly description: string;
	/**
	 *Unique catalog identifier for this move.
	 */
	readonly id: string;
	/**
	 *Display name shown in the UI.
	 */
	readonly name: string;

	private constructor(attributes: AttributeMap<T>, description: string, id: string, name: string) {
		this.attributes = attributes;
		this.description = description;
		this.id = id;
		this.name = name;
	}

	/**
	 * Creates a Move with validated attribute values.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param description - Flavour or lore text (may be empty).
	 * @param values - Typed attribute values to assign to this move.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Move instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         value lacks a definition or fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		name: string,
		description: string,
		values: T,
		definitions: AttributeDefinition[]
	): Move<T> {
		if (!id) {
			throw new InvalidArgumentError('Move id is required', 'Move');
		}
		if (!name) {
			throw new InvalidArgumentError('Move name is required', 'Move');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Move');

		return new Move(attributeMap, description, id, name);
	}

	/**
	 * Hydrates a Move from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing a Move from a persistence layer where
	 * the data was already validated at write time.
	 *
	 * @param primitives - A {@link MovePrimitives} snapshot.
	 * @returns A rehydrated Move instance.
	 */
	static fromPrimitives(primitives: MovePrimitives): Move {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Move(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Serialises this Move into a plain {@link MovePrimitives} object.
	 */
	toPrimitives(): MovePrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
