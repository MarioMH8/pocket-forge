import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AttributeAssignment, AttributeDefinition, AttributeValues } from '@pocket-forge/attributes/domain';
import {
	hydrateAttributeMap,
	serializeAttributeMap,
	validateAndBuildAttributeMap,
} from '@pocket-forge/attributes/domain';

/**
 * Primitives representation of an Ability snapshot.
 */
export interface AbilityPrimitives {
	readonly attributes: AttributeValues;
	readonly description: string;
	readonly id: string;
	readonly name: string;
}

/**
 * An immutable catalog entry describing a creature ability.
 * Carries validated attribute assignments.
 */
export default class Ability {
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
	 * Creates an Ability with validated attribute assignments.
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

		const attributeMap = validateAndBuildAttributeMap(assignments, definitions, 'Ability');

		return new Ability(attributeMap, description, id, name);
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: AbilityPrimitives): Ability {
		const attributeMap = hydrateAttributeMap(primitives.attributes);

		return new Ability(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Returns the value of a specific attribute, or undefined if not set.
	 */
	getAttribute(key: string): boolean | boolean[] | number | number[] | string | string[] | undefined {
		return this.attributes.get(key)?.value;
	}

	toPrimitives(): AbilityPrimitives {
		return {
			attributes: serializeAttributeMap(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
