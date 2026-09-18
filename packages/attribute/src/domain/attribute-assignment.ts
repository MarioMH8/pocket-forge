import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';

import type { AttributeValue } from './attribute.types';
import type AttributeDefinition from './attribute-definition';

/**
 * Stores one validated current value per attribute key.
 * The assignment is validated against its corresponding AttributeDefinition.
 */
export default class AttributeAssignment {
	readonly key: string;
	readonly value: AttributeValue;

	private constructor(primitives: Primitives<AttributeAssignment>) {
		this.key = primitives.key;
		this.value = primitives.value;
	}

	/**
	 * Creates a validated AttributeAssignment.
	 * Validates the value against the provided definition.
	 */
	static create(primitives: Primitives<AttributeAssignment>, definition: AttributeDefinition): AttributeAssignment {
		if (primitives.key !== definition.key) {
			throw new InvalidArgumentError(
				`Assignment key "${primitives.key}" does not match definition key "${definition.key}"`,
				'AttributeAssignment'
			);
		}
		const error = definition.validateValue(primitives.value);
		if (error) {
			throw new InvalidArgumentError(
				`Invalid value for attribute "${primitives.key}": ${error.message}`,
				'AttributeAssignment'
			);
		}

		return new AttributeAssignment(primitives);
	}

	static fromPrimitives(primitives: Primitives<AttributeAssignment>): AttributeAssignment {
		return new AttributeAssignment(primitives);
	}

	toPrimitives(): Primitives<AttributeAssignment> {
		return {
			key: this.key,
			value: this.value,
		};
	}
}
