/**
 * Supported attribute types for the neutral attribute system.
 */
type AttributeType = 'array' | 'boolean' | 'enum' | 'number' | 'string';

/**
 * Constraints that apply to an attribute definition.
 * - `min` / `max`: numeric range (for number type).
 * - `validValues`: allowed values (for enum type).
 * - `itemType`: element type for array items.
 * - `minLength` / `maxLength`: length constraints (for string or array).
 */
interface AttributeConstraints {
	readonly itemType?: 'boolean' | 'number' | 'string';
	readonly max?: number;
	readonly maxLength?: number;
	readonly min?: number;
	readonly minLength?: number;
	readonly validValues?: readonly string[];
}

/**
 * Primitives representation of an AttributeDefinition.
 */
interface AttributeDefinitionPrimitives {
	readonly constraints?: AttributeConstraints | undefined;
	readonly defaultValue: AttributeValue;
	readonly key: string;
	readonly type: AttributeType;
}

/**
 * Primitives representation of an AttributeAssignment.
 */
interface AttributeAssignmentPrimitives {
	readonly key: string;
	readonly value: AttributeValue;
}

/**
 * A named type for attribute values.
 */
type AttributeValue = boolean | boolean[] | number | number[] | string | string[];

/**
 * A plain record of attribute values keyed by attribute key.
 */
type AttributeValues = Record<string, AttributeValue>;

export type {
	AttributeAssignmentPrimitives,
	AttributeConstraints,
	AttributeDefinitionPrimitives,
	AttributeType,
	AttributeValue,
	AttributeValues,
};
