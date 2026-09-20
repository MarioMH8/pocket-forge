import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';

import type { AttributeConstraints, AttributeType, AttributeValue } from './attribute.types';

/**
 * A catalog-owned definition that declares the key, type, default value,
 * and optional constraints for a reusable project-level attribute.
 *
 * AttributeDefinitions are the schema layer of the attribute system. They
 * describe *what kind* of data an attribute holds and how to validate it.
 * Individual entities (Species, Moves, Abilities, Creatures) then carry
 * {@link AttributeMap}s whose values must conform to these definitions.
 *
 * @example
 * ```ts
 * // A numeric attribute with range constraints
 * const hpDef = AttributeDefinition.create({
 *   key: 'baseHp', type: 'number', defaultValue: 10,
 *   constraints: { min: 1, max: 255 },
 * });
 *
 * // An enum attribute
 * const typeDef = AttributeDefinition.create({
 *   key: 'element', type: 'enum', defaultValue: 'neutral',
 *   constraints: { validValues: ['fire', 'water', 'grass', 'neutral'] },
 * });
 *
 * // Validate a raw value at runtime
 * const error = hpDef.validateValue(300);
 * // error.message === 'Value 300 exceeds maximum 255'
 * ```
 */
export default class AttributeDefinition {
	/**
	 *Optional constraints that govern valid values (ranges, allowed values, etc.).
	 */
	readonly constraints: AttributeConstraints;
	/**
	 *The fallback value used when no explicit assignment is provided.
	 *
	 * Optional. When omitted and {@link required} is `true`, the caller
	 * must supply an explicit value for every entity.
	 */
	readonly defaultValue?: AttributeValue | undefined;
	/**
	 *Unique key that identifies this attribute across the project.
	 */
	readonly key: string;
	/**
	 *Whether this attribute must be present on every entity.
	 *
	 * Defaults to `false`. When `true`, {@link AttributeMap.create}
	 * requires an explicit value or a `defaultValue` for the key.
	 * When `false`, the key is skipped entirely if no value is provided.
	 */
	readonly required?: boolean | undefined;
	/**
	 *The data type of this attribute.
	 */
	readonly type: AttributeType;

	private constructor(primitives: Primitives<AttributeDefinition>) {
		const { constraints, defaultValue, key, required, type } = primitives;
		this.constraints = constraints;
		this.defaultValue = defaultValue;
		this.key = key;
		this.required = required;
		this.type = type;
	}

	/**
	 * Creates a validated AttributeDefinition.
	 *
	 * Self-validates the definition on construction: the key must be non-empty,
	 * the type must be one of the known {@link AttributeType} values, the default
	 * value must pass validation, and type-specific constraints (e.g. `validValues`
	 * for enums, `itemType` for arrays) must be present.
	 *
	 * @param primitives - Plain object with `key`, `type`, `defaultValue`, and `constraints`.
	 * @returns A fully validated AttributeDefinition.
	 * @throws {InvalidArgumentError} When the definition is structurally invalid
	 *         or the default value fails its own validation.
	 */
	static create(primitives: Primitives<AttributeDefinition>): AttributeDefinition {
		const definition = new AttributeDefinition(primitives);
		definition.validateDefinition();

		return definition;
	}

	/**
	 * Hydrates an AttributeDefinition from primitives without re-validating.
	 *
	 * Use this when reconstructing from a persistence layer where the definition
	 * was already validated at write time.
	 *
	 * @param primitives - Plain object with `key`, `type`, `defaultValue`, and `constraints`.
	 * @returns A rehydrated AttributeDefinition.
	 */
	static fromPrimitives(primitives: Primitives<AttributeDefinition>): AttributeDefinition {
		return new AttributeDefinition(primitives);
	}

	toPrimitives(): Primitives<AttributeDefinition> {
		return {
			constraints: { ...this.constraints },
			defaultValue: this.defaultValue,
			key: this.key,
			required: this.required,
			type: this.type,
		};
	}

	/**
	 * Validates a raw value against this definition's type and constraints.
	 *
	 * @param value - The raw value to validate.
	 * @returns An {@link InvalidArgumentError} describing the violation,
	 *          or `undefined` if the value is valid.
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

		/*
		 * Required attributes must have a defaultValue or the caller must provide one.
		 * We only validate defaultValue when it's present.
		 */
		if (this.defaultValue !== undefined) {
			const defaultError = this.validateValue(this.defaultValue);
			if (defaultError) {
				throw new InvalidArgumentError(
					`AttributeDefinition default value is invalid: ${defaultError.message}`,
					'AttributeDefinition'
				);
			}
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
				`"${value}" is not a valid value for attribute "${this.key}". Allowed: ${String(this.constraints.validValues?.join(', '))}`,
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
