import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import type AttributeDefinition from './attribute-definition';
import type { AttributeAssignmentPrimitives } from './attribute-types';

/**
 * Stores one validated current value per attribute key.
 * The assignment is validated against its corresponding AttributeDefinition.
 */
export default class AttributeAssignment {
	readonly key: string;
	readonly value: boolean | boolean[] | number | number[] | string | string[];

	private constructor(primitives: AttributeAssignmentPrimitives) {
		this.key = primitives.key;
		this.value = primitives.value;
	}

	/**
	 * Creates a validated AttributeAssignment.
	 * Validates the value against the provided definition.
	 */
	static create(primitives: AttributeAssignmentPrimitives, definition: AttributeDefinition): AttributeAssignment {
		const error = definition.validateValue(primitives.value);
		if (error) {
			throw new InvalidArgumentError(
				`Invalid value for attribute "${primitives.key}": ${error.message}`,
				'AttributeAssignment'
			);
		}
		if (primitives.key !== definition.key) {
			throw new InvalidArgumentError(
				`Assignment key "${primitives.key}" does not match definition key "${definition.key}"`,
				'AttributeAssignment'
			);
		}

		return new AttributeAssignment(primitives);
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static default(definition: AttributeDefinition): AttributeAssignment {
		return new AttributeAssignment({
			key: definition.key,
			value: definition.defaultValue,
		});
	}

	static fromPrimitives(primitives: AttributeAssignmentPrimitives): AttributeAssignment {
		return new AttributeAssignment(primitives);
	}

	toPrimitives(): AttributeAssignmentPrimitives {
		return {
			key: this.key,
			value: this.value,
		};
	}
}
