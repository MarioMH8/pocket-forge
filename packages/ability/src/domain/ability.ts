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
 * Primitives representation of an Ability snapshot.
 *
 * Mirrors the {@link Ability} shape but replaces the internal
 * `ReadonlyMap` of attributes with a plain {@link AttributeValues} record
 * suitable for serialisation and persistence.
 */
export interface AbilityPrimitives extends Primitives<Omit<Ability, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature ability.
 *
 * Each ability carries a set of validated {@link AttributeAssignment} values
 * that define its gameplay properties — cooldown, duration, effect magnitude,
 * etc. Abilities are created through the {@link Ability.create} factory,
 * which validates all assignments against their corresponding
 * {@link AttributeDefinition}s.
 *
 * @example
 * ```ts
 * import { AttributeAssignment, AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const cooldownDef = AttributeDefinition.create({
 *   key: 'cooldown', type: 'number', defaultValue: 0,
 *   constraints: { min: 0 },
 * });
 * const cooldownAssignment = AttributeAssignment.create({ key: 'cooldown', value: 3 }, cooldownDef);
 *
 * const ability = Ability.create(
 *   'ab-001', 'Intimidate', 'Lowers the foe\'s attack on entry.',
 *   [cooldownAssignment], [cooldownDef]
 * );
 * console.log(ability.getAttribute('cooldown')); // 3
 * ```
 */
export default class Ability {
	/**
	 *Validated attribute assignments keyed by attribute name.
	 */
	readonly attributes: ReadonlyMap<string, AttributeAssignment>;
	/**
	 *Human-readable flavour or lore text.
	 */
	readonly description: string;
	/**
	 *Unique catalog identifier for this ability.
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
	 * Creates an Ability with validated attribute assignments.
	 *
	 * Every assignment in `assignments` must have a matching entry in
	 * `definitions`, and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param description - Flavour or lore text (may be empty).
	 * @param assignments - Attribute values to assign to this ability.
	 * @param definitions - Attribute definitions that govern the assignments.
	 * @returns A fully validated Ability instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         assignment lacks a definition or fails validation.
	 */
	static create(
		id: string,
		name: string,
		description: string,
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[]
	): Ability {
		if (!id) {
			throw new InvalidArgumentError('Ability id is required', 'Ability');
		}
		if (!name) {
			throw new InvalidArgumentError('Ability name is required', 'Ability');
		}

		const attributeMap = AttributeMap.validateAndBuildAttributeMap(assignments, definitions, 'Ability');

		return new Ability(attributeMap, description, id, name);
	}

	/**
	 * Hydrates an Ability from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing an Ability from a persistence layer where
	 * the data was already validated at write time.
	 *
	 * @param primitives - An {@link AbilityPrimitives} snapshot.
	 * @returns A rehydrated Ability instance.
	 */
	static fromPrimitives(primitives: AbilityPrimitives): Ability {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Ability(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Returns the value of a specific attribute, or `undefined` if not set.
	 *
	 * @param key - The attribute key to look up (e.g. `'cooldown'`).
	 * @returns The attribute's current value, or `undefined`.
	 */
	getAttribute(key: string): AttributeValue | undefined {
		return this.attributes.get(key)?.value;
	}

	/**
	 * Serialises this Ability into a plain {@link AbilityPrimitives} object.
	 */
	toPrimitives(): AbilityPrimitives {
		return {
			attributes: AttributeMap.toPrimitives(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
