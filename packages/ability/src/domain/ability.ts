import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

/**
 * Primitives representation of an Ability snapshot.
 *
 * Mirrors the {@link Ability} shape but replaces the internal
 * {@link AttributeMap} of attributes with a plain {@link AttributeValues} record
 * suitable for serialization and persistence.
 */
export interface AbilityPrimitives extends Primitives<Omit<Ability, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature ability.
 *
 * Each ability carries a set of validated attribute values that define
 * its gameplay properties — cooldown, duration, effect magnitude, etc.
 * Abilities are created through the {@link Ability.create} factory,
 * which validates all values against their corresponding
 * {@link AttributeDefinition}s.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * import { AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const cooldownDef = AttributeDefinition.create({
 *   key: 'cooldown', type: 'number', defaultValue: 0,
 *   constraints: { min: 0 },
 * });
 *
 * const ability = Ability.create(
 *   'ab-001',
 *   { cooldown: 3 },
 *   [cooldownDef]
 * );
 * console.log(ability.attributes.value.cooldown); // 3
 * ```
 */
export default class Ability<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	/**
	 *Validated attribute values keyed by attribute name.
	 */
	readonly attributes: AttributeMap<T>;
	/**
	 *Unique catalog identifier for this ability.
	 */
	readonly id: string;

	private constructor(attributes: AttributeMap<T>, id: string) {
		this.attributes = attributes;
		this.id = id;
	}

	/**
	 * Creates an Ability with validated attribute values.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param values - Typed attribute values to assign to this ability.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Ability instance.
	 * @throws {InvalidArgumentError} When `id` is empty, or when any value
	 *         lacks a definition or fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		values: T,
		definitions: AttributeDefinition[]
	): Ability<T> {
		if (!id) {
			throw new InvalidArgumentError('Ability id is required', 'Ability');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Ability');

		return new Ability(attributeMap, id);
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

		return new Ability(attributeMap, primitives.id);
	}

	/**
	 * Serializes this Ability into a plain {@link AbilityPrimitives} object.
	 */
	toPrimitives(): AbilityPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			id: this.id,
		};
	}
}
