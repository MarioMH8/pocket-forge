import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import type { AttributeConstraints, AttributeDefinitionPrimitives, AttributeType } from './attribute-types';

/**
 * A catalog-owned definition that declares the key, type, default value,
 * and optional constraints for a reusable project-level attribute.
 */
export default class AttributeDefinition {
	readonly constraints: AttributeConstraints;
	readonly defaultValue: boolean | boolean[] | number | number[] | string | string[];
	readonly key: string;
	readonly type: AttributeType;

	private constructor(primitives: AttributeDefinitionPrimitives) {
		const { constraints = {}, defaultValue, key, type } = primitives;
		this.constraints = constraints;
		this.defaultValue = defaultValue;
		this.key = key;
		this.type = type;
	}

	/**
	 * Creates a validated AttributeDefinition.
	 * Throws an InvalidArgumentError if the definition is invalid.
	 */
	static create(primitives: AttributeDefinitionPrimitives): AttributeDefinition {
		const definition = new AttributeDefinition(primitives);
		definition.validateDefinition();

		return definition;
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: AttributeDefinitionPrimitives): AttributeDefinition {
		return new AttributeDefinition(primitives);
	}

	toPrimitives(): AttributeDefinitionPrimitives {
		const constraints = Object.keys(this.constraints).length > 0 ? { ...this.constraints } : undefined;

		return {
			defaultValue: this.defaultValue,
			key: this.key,
			type: this.type,
			...(constraints !== undefined && { constraints }),
		};
	}

	/**
	 * Validates a raw value against this definition.
	 * Returns an InvalidArgumentError if invalid, or undefined if valid.
	 */
	validateValue(value: unknown): InvalidArgumentError | undefined {
		switch (this.type) {
			case 'array': {
				return this.validateArray(value);
			}
			case 'boolean': {
				return this.validateBoolean(value);
			}
			case 'enum': {
				return this.validateEnum(value);
			}
			case 'number': {
				return this.validateNumber(value);
			}
			case 'string': {
				return this.validateString(value);
			}
		}
	}

	private validateArray(value: unknown): InvalidArgumentError | undefined {
		if (!Array.isArray(value)) {
			return new InvalidArgumentError(`Expected array, got ${typeof value}`, 'AttributeDefinition');
		}
		if (this.constraints.minLength !== undefined && value.length < this.constraints.minLength) {
			return new InvalidArgumentError(
				`Array length ${String(value.length)} is below minimum ${String(this.constraints.minLength)}`,
				'AttributeDefinition'
			);
		}
		if (this.constraints.maxLength !== undefined && value.length > this.constraints.maxLength) {
			return new InvalidArgumentError(
				`Array length ${String(value.length)} exceeds maximum ${String(this.constraints.maxLength)}`,
				'AttributeDefinition'
			);
		}
		const itemType = this.constraints.itemType;
		for (const [index, element] of value.entries()) {
			// eslint-disable-next-line valid-typeof
			if (typeof element !== itemType) {
				return new InvalidArgumentError(
					`Array item at index ${String(index)} expected ${String(itemType)}, got ${typeof element}`,
					'AttributeDefinition'
				);
			}
		}

		return undefined;
	}

	private validateBoolean(value: unknown): InvalidArgumentError | undefined {
		if (typeof value !== 'boolean') {
			return new InvalidArgumentError(`Expected boolean, got ${typeof value}`, 'AttributeDefinition');
		}

		return undefined;
	}

	private validateDefinition(): void {
		if (!this.key || typeof this.key !== 'string') {
			throw new InvalidArgumentError('AttributeDefinition key must be a non-empty string', 'AttributeDefinition');
		}

		const validTypes: AttributeType[] = ['string', 'number', 'boolean', 'enum', 'array'];
		if (!validTypes.includes(this.type)) {
			throw new InvalidArgumentError(
				`AttributeDefinition type must be one of: ${validTypes.join(', ')}`,
				'AttributeDefinition'
			);
		}

		const defaultError = this.validateValue(this.defaultValue);
		if (defaultError) {
			throw new InvalidArgumentError(
				`AttributeDefinition default value is invalid: ${defaultError.message}`,
				'AttributeDefinition'
			);
		}

		if (this.type === 'enum' && (!this.constraints.validValues || this.constraints.validValues.length === 0)) {
			throw new InvalidArgumentError(
				'AttributeDefinition of type "enum" must have validValues constraint',
				'AttributeDefinition'
			);
		}

		if (this.type === 'array' && !this.constraints.itemType) {
			throw new InvalidArgumentError(
				'AttributeDefinition of type "array" must have itemType constraint',
				'AttributeDefinition'
			);
		}
	}

	private validateEnum(value: unknown): InvalidArgumentError | undefined {
		if (typeof value !== 'string') {
			return new InvalidArgumentError(`Expected string for enum, got ${typeof value}`, 'AttributeDefinition');
		}
		if (!this.constraints.validValues?.includes(value)) {
			return new InvalidArgumentError(
				`"${value}" is not a valid value. Allowed: ${String(this.constraints.validValues?.join(', '))}`,
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateNumber(value: unknown): InvalidArgumentError | undefined {
		if (typeof value !== 'number' || Number.isNaN(value)) {
			return new InvalidArgumentError(`Expected number, got ${typeof value}`, 'AttributeDefinition');
		}
		if (this.constraints.min !== undefined && value < this.constraints.min) {
			return new InvalidArgumentError(
				`Value ${String(value)} is below minimum ${String(this.constraints.min)}`,
				'AttributeDefinition'
			);
		}
		if (this.constraints.max !== undefined && value > this.constraints.max) {
			return new InvalidArgumentError(
				`Value ${String(value)} exceeds maximum ${String(this.constraints.max)}`,
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateString(value: unknown): InvalidArgumentError | undefined {
		if (typeof value !== 'string') {
			return new InvalidArgumentError(`Expected string, got ${typeof value}`, 'AttributeDefinition');
		}
		if (this.constraints.minLength !== undefined && value.length < this.constraints.minLength) {
			return new InvalidArgumentError(
				`String length ${String(value.length)} is below minimum ${String(this.constraints.minLength)}`,
				'AttributeDefinition'
			);
		}
		if (this.constraints.maxLength !== undefined && value.length > this.constraints.maxLength) {
			return new InvalidArgumentError(
				`String length ${String(value.length)} exceeds maximum ${String(this.constraints.maxLength)}`,
				'AttributeDefinition'
			);
		}

		return undefined;
	}
}
