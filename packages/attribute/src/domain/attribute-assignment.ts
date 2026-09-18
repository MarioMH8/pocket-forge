import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';

import type { AttributeValue } from './attribute.types';
import type AttributeDefinition from './attribute-definition';

/**
 * Stores one validated current value per attribute key.
 *
 * An AttributeAssignment is the *instance* side of the attribute system:
 * it holds a concrete value for a specific attribute key, and that value
 * must have been validated against the corresponding
 * {@link AttributeDefinition} at creation time.
 *
 * @example
 * ```ts
 * const hpDef = AttributeDefinition.create({
 *   key: 'baseHp', type: 'number', defaultValue: 10,
 *   constraints: { min: 1, max: 255 },
 * });
 *
 * // Valid assignment
 * const hp = AttributeAssignment.create({ key: 'baseHp', value: 45 }, hpDef);
 *
 * // Throws — value out of range
 * AttributeAssignment.create({ key: 'baseHp', value: 999 }, hpDef);
 * ```
 */
export default class AttributeAssignment {
	/**
	 *The attribute key this assignment corresponds to.
	 */
	readonly key: string;
	/**
	 *The current validated value.
	 */
	readonly value: AttributeValue;

	private constructor(primitives: Primitives<AttributeAssignment>) {
		this.key = primitives.key;
		this.value = primitives.value;
	}

	/**
	 * Creates a validated AttributeAssignment.
	 *
	 * The assignment key must match the definition key, and the value must
	 * pass the definition's type and constraint checks.
	 *
	 * @param primitives - Plain object with `key` and `value`.
	 * @param definition - The {@link AttributeDefinition} that governs this assignment.
	 * @returns A validated AttributeAssignment.
	 * @throws {InvalidArgumentError} When the key does not match the definition,
	 *         or the value fails validation.
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

	/**
	 * Hydrates an AttributeAssignment from primitives without re-validating.
	 *
	 * Use this when reconstructing from a persistence layer where the value
	 * was already validated at write time.
	 *
	 * @param primitives - Plain object with `key` and `value`.
	 * @returns A rehydrated AttributeAssignment.
	 */
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
