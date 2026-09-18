import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import type { AttributeValues } from './attribute.types';
import AttributeAssignment from './attribute-assignment';
import type AttributeDefinition from './attribute-definition';

/**
 * Static utility for building, hydrating, and serialising attribute maps.
 *
 * AttributeMap bridges the gap between the plain {@link AttributeValues}
 * records used for persistence and the strongly-typed
 * `ReadonlyMap<string, AttributeAssignment>` used internally by domain entities.
 */
export default class AttributeMap {
	/**
	 * Hydrates a `ReadonlyMap` of {@link AttributeAssignment}s from a plain
	 * record of values. Skips validation — intended for persistence hydration
	 * where data was already validated at write time.
	 *
	 * @param attributes - A plain record of attribute values keyed by attribute name.
	 * @returns A read-only map of rehydrated assignments.
	 */
	static fromPrimitives(attributes: AttributeValues): ReadonlyMap<string, AttributeAssignment> {
		const attributeMap = new Map<string, AttributeAssignment>();
		for (const [key, value] of Object.entries(attributes)) {
			attributeMap.set(key, AttributeAssignment.fromPrimitives({ key, value }));
		}

		return attributeMap;
	}

	/**
	 * Serialises a `ReadonlyMap` of {@link AttributeAssignment}s into a plain
	 * {@link AttributeValues} record suitable for persistence or transport.
	 *
	 * @param attributeMap - The map of assignments to serialise.
	 * @returns A plain record of attribute values.
	 */
	static toPrimitives(attributeMap: ReadonlyMap<string, AttributeAssignment>): AttributeValues {
		const attributes: AttributeValues = {};
		for (const [key, assignment] of attributeMap) {
			attributes[key] = assignment.value;
		}

		return attributes;
	}

	/**
	 * Validates and builds a `ReadonlyMap` of {@link AttributeAssignment}s
	 * from raw assignments and their corresponding definitions.
	 *
	 * Every assignment must have a matching definition, and its value must
	 * satisfy that definition's constraints.
	 *
	 * @param assignments - The raw attribute assignments to validate.
	 * @param definitions - The attribute definitions that govern the assignments.
	 * @param entityName - Name of the entity being built (used in error messages).
	 * @returns A read-only map of validated assignments.
	 * @throws {InvalidArgumentError} When any assignment lacks a definition
	 *         or fails validation.
	 */
	static validateAndBuildAttributeMap(
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[],
		entityName: string
	): ReadonlyMap<string, AttributeAssignment> {
		const definitionMap = new Map(definitions.map(d => [d.key, d]));
		const attributeMap = new Map<string, AttributeAssignment>();

		for (const assignment of assignments) {
			const definition = definitionMap.get(assignment.key);
			if (!definition) {
				throw new InvalidArgumentError(`No definition found for attribute "${assignment.key}"`, entityName);
			}
			AttributeAssignment.create(assignment.toPrimitives(), definition);
			attributeMap.set(assignment.key, assignment);
		}

		return attributeMap;
	}
}
