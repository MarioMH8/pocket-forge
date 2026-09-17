import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import AttributeAssignment from './attribute-assignment';
import type AttributeDefinition from './attribute-definition';
import type { AttributeValues } from './attribute-types';

/**
 * Validates and builds a ReadonlyMap of AttributeAssignments from raw assignments
 * and their corresponding definitions. Throws if any assignment lacks a definition
 * or fails validation.
 */
function validateAndBuildAttributeMap(
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

/**
 * Hydrates a ReadonlyMap of AttributeAssignments from a plain record of values.
 * Skips validation (for persistence hydration).
 */
function hydrateAttributeMap(attributes: AttributeValues): ReadonlyMap<string, AttributeAssignment> {
	const attributeMap = new Map<string, AttributeAssignment>();
	for (const [key, value] of Object.entries(attributes)) {
		attributeMap.set(key, AttributeAssignment.fromPrimitives({ key, value }));
	}

	return attributeMap;
}

/**
 * Serializes a ReadonlyMap of AttributeAssignments into a plain record.
 */
function serializeAttributeMap(attributeMap: ReadonlyMap<string, AttributeAssignment>): AttributeValues {
	const attributes: AttributeValues = {};
	for (const [key, assignment] of attributeMap) {
		attributes[key] = assignment.value;
	}

	return attributes;
}

export { hydrateAttributeMap, serializeAttributeMap, validateAndBuildAttributeMap };
