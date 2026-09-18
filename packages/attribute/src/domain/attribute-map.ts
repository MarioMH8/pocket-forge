import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import type { AttributeValue, AttributeValues } from './attribute.types';
import AttributeAssignment from './attribute-assignment';
import type AttributeDefinition from './attribute-definition';

/**
 * A typed, immutable container for validated attribute values.
 *
 * AttributeMap bridges the gap between the plain {@link AttributeValues}
 * records used for persistence and strongly-typed attribute access in
 * domain entities. It validates values at construction time against
 * {@link AttributeDefinition}s and exposes them through the typed
 * {@link value} property.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * const hpDef = AttributeDefinition.create({
 *   key: 'hp', type: 'number', defaultValue: 10,
 *   constraints: { min: 1, max: 255 },
 * });
 *
 * // Typed creation — T is inferred as { hp: number }
 * const map = AttributeMap.create({ hp: 45 }, [hpDef], 'Creature');
 * console.log(map.value.hp); // 45 (typed as number)
 *
 * // Hydration from persistence — untyped
 * const hydrated = AttributeMap.fromPrimitives({ hp: 45 });
 * console.log(hydrated.value.hp); // 45 (typed as AttributeValue)
 * ```
 */
export default class AttributeMap<T extends AttributeValues = AttributeValues> {
	/**
	 * The validated attribute values, keyed by attribute name.
	 */
	readonly value: T;

	private constructor(value: T) {
		this.value = value;
	}

	/**
	 * Creates a validated AttributeMap from a typed values object.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy that definition's constraints.
	 *
	 * @param values - A typed record of attribute values.
	 * @param definitions - The attribute definitions that govern the values.
	 * @param entityName - Name of the entity being built (used in error messages).
	 * @returns A fully validated AttributeMap with the inferred type.
	 * @throws {InvalidArgumentError} When any value lacks a definition
	 *         or fails validation.
	 */
	static create<T extends AttributeValues>(
		values: T,
		definitions: AttributeDefinition[],
		entityName: string
	): AttributeMap<T> {
		const definitionMap = new Map(definitions.map(d => [d.key, d]));

		for (const [key, value] of Object.entries(values)) {
			const definition = definitionMap.get(key);
			if (!definition) {
				throw new InvalidArgumentError(`No definition found for attribute "${key}"`, entityName);
			}
			AttributeAssignment.create({ key, value }, definition);
		}

		return new AttributeMap(values);
	}

	/**
	 * Hydrates an AttributeMap from a plain record without re-validating.
	 *
	 * Use this when reconstructing from a persistence layer where data
	 * was already validated at write time. The returned map is untyped
	 * since no type information is available at hydration time.
	 *
	 * @param attributes - A plain record of attribute values keyed by attribute name.
	 * @returns A rehydrated, untyped AttributeMap.
	 */
	static fromPrimitives(attributes: AttributeValues): AttributeMap {
		return new AttributeMap(attributes);
	}

	/**
	 * Serialises this AttributeMap into a plain {@link AttributeValues} record
	 * suitable for persistence or transport.
	 */
	toPrimitives(): AttributeValues {
		return { ...this.value };
	}
}
