import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type {
	AttributeAssignment,
	AttributeDefinition,
	AttributeValue,
	AttributeValues,
} from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

/**
 * Primitives representation of a Move snapshot.
 *
 * Mirrors the {@link Move} shape but replaces the internal
 * `ReadonlyMap` of attributes with a plain {@link AttributeValues} record
 * suitable for serialisation and persistence.
 */
export interface MovePrimitives extends Primitives<Omit<Move, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature move.
 *
 * Each move carries a set of validated {@link AttributeAssignment} values
 * that define its gameplay properties — power, accuracy, type affinity,
 * energy cost, etc. Moves are created through the {@link Move.create}
 * factory, which validates all assignments against their corresponding
 * {@link AttributeDefinition}s.
 *
 * @example
 * ```ts
 * import { AttributeAssignment, AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const powerDef = AttributeDefinition.create({
 *   key: 'power', type: 'number', defaultValue: 0,
 *   constraints: { min: 0, max: 250 },
 * });
 * const powerAssignment = AttributeAssignment.create({ key: 'power', value: 90 }, powerDef);
 *
 * const move = Move.create(
 *   'mv-001', 'Flame Burst', 'A concentrated blast of fire.',
 *   [powerAssignment], [powerDef]
 * );
 * console.log(move.getAttribute('power')); // 90
 * ```
 */
export default class Move {
	/**
	 *Validated attribute assignments keyed by attribute name.
	 */
	readonly attributes: ReadonlyMap<string, AttributeAssignment>;
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

	private constructor(
		attributes: ReadonlyMap<string, AttributeAssignment>,
		description: string,
		id: string,
		name: string
	) {
		this.attributes = attributes;
		this.description = description;
		this.id = id;
		this.name = name;
	}

	/**
	 * Creates a Move with validated attribute assignments.
	 *
	 * Every assignment in `assignments` must have a matching entry in
	 * `definitions`, and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param description - Flavour or lore text (may be empty).
	 * @param assignments - Attribute values to assign to this move.
	 * @param definitions - Attribute definitions that govern the assignments.
	 * @returns A fully validated Move instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         assignment lacks a definition or fails validation.
	 */
	static create(
		id: string,
		name: string,
		description: string,
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[]
	): Move {
		if (!id) {
			throw new InvalidArgumentError('Move id is required', 'Move');
		}
		if (!name) {
			throw new InvalidArgumentError('Move name is required', 'Move');
		}

		const attributeMap = AttributeMap.validateAndBuildAttributeMap(assignments, definitions, 'Move');

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
	 * Returns the value of a specific attribute, or `undefined` if not set.
	 *
	 * @param key - The attribute key to look up (e.g. `'power'`).
	 * @returns The attribute's current value, or `undefined`.
	 */
	getAttribute(key: string): AttributeValue | undefined {
		return this.attributes.get(key)?.value;
	}

	/**
	 * Serialises this Move into a plain {@link MovePrimitives} object.
	 */
	toPrimitives(): MovePrimitives {
		return {
			attributes: AttributeMap.toPrimitives(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
