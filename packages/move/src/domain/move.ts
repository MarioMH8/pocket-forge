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
 */
export interface MovePrimitives extends Primitives<Omit<Move, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature move.
 * Carries validated attribute assignments.
 */
export default class Move {
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
	 * Creates a Move with validated attribute assignments.
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
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: MovePrimitives): Move {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Move(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Returns the value of a specific attribute, or undefined if not set.
	 */
	getAttribute(key: string): AttributeValue | undefined {
		return this.attributes.get(key)?.value;
	}

	toPrimitives(): MovePrimitives {
		return {
			attributes: AttributeMap.toPrimitives(this.attributes),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
