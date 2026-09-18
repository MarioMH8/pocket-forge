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
 * Primitives representation of a Species snapshot.
 */
export interface SpeciesPrimitives extends Primitives<Omit<Species, 'attributes'>> {
	readonly attributes: AttributeValues;
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

		const attributeMap = AttributeMap.validateAndBuildAttributeMap(assignments, definitions, 'Species');

		return new Species(attributeMap, description, id, name);
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: SpeciesPrimitives): Species {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Species(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Returns the value of a specific attribute, or undefined if not set.
	 */
	getAttribute(key: string): AttributeValue | undefined {
		return this.attributes.get(key)?.value;
	}

	toPrimitives(): SpeciesPrimitives {
		return {
			attributes: AttributeMap.toPrimitives(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
