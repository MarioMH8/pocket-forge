import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AttributeAssignment, AttributeDefinition, AttributeValues } from '@pocket-forge/attributes/domain';
import {
	hydrateAttributeMap,
	serializeAttributeMap,
	validateAndBuildAttributeMap,
} from '@pocket-forge/attributes/domain';

/**
 * Primitives representation of a Species snapshot.
 */
export interface SpeciesPrimitives {
	readonly attributes: AttributeValues;
	readonly description: string;
	readonly id: string;
	readonly name: string;
}

/**
 * An immutable catalog entry describing a creature species.
 * Carries validated attribute assignments.
 */
export default class Species {
	readonly attributes: ReadonlyMap<string, AttributeAssignment>;
	readonly description: string;
	readonly id: string;
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
	 * Creates a Species with validated attribute assignments.
	 */
	static create(
		id: string,
		name: string,
		description: string,
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[]
	): Species {
		if (!id) {
			throw new InvalidArgumentError('Species id is required', 'Species');
		}
		if (!name) {
			throw new InvalidArgumentError('Species name is required', 'Species');
		}

		const attributeMap = validateAndBuildAttributeMap(assignments, definitions, 'Species');

		return new Species(attributeMap, description, id, name);
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: SpeciesPrimitives): Species {
		const attributeMap = hydrateAttributeMap(primitives.attributes);

		return new Species(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Returns the value of a specific attribute, or undefined if not set.
	 */
	getAttribute(key: string): boolean | boolean[] | number | number[] | string | string[] | undefined {
		return this.attributes.get(key)?.value;
	}

	toPrimitives(): SpeciesPrimitives {
		return {
			attributes: serializeAttributeMap(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
