import InvalidArgumentError from '@hexadrop/error/invalid-argument';

/**
 * Supported attribute types for the neutral attribute system.
 */
type AttributeType = 'array' | 'boolean' | 'enum' | 'number' | 'record' | 'string';

/**
 * Constraints that apply to an attribute definition.
 * - `fields`: nested definitions for a record attribute (required and non-empty for records).
 * - `itemDefinition`: definition for each item of an array of records (exclusive with `itemType`).
 * - `itemType`: element type for arrays of scalars (exclusive with `itemDefinition`).
 * - `min` / `max`: numeric range (for number type).
 * - `validValues`: allowed values (for enum type).
 * - `minLength` / `maxLength`: length constraints (for string or array).
 */
interface AttributeConstraints {
	readonly fields?: readonly AttributeDefinition[] | undefined;
	readonly itemDefinition?: AttributeDefinition | undefined;
	readonly itemType?: 'boolean' | 'number' | 'string' | undefined;
	readonly max?: number | undefined;
	readonly maxLength?: number | undefined;
	readonly min?: number | undefined;
	readonly minLength?: number | undefined;
	readonly validValues?: string[] | undefined;
}

/**
 * Plain-object form of {@link AttributeConstraints}, used to build and persist definitions.
 *
 * Nested definitions appear as primitives so the whole schema stays serializable.
 */
interface AttributeConstraintsPrimitives {
	readonly fields?: readonly AttributeDefinitionPrimitives[] | undefined;
	readonly itemDefinition?: AttributeDefinitionPrimitives | undefined;
	readonly itemType?: 'boolean' | 'number' | 'string' | undefined;
	readonly max?: number | undefined;
	readonly maxLength?: number | undefined;
	readonly min?: number | undefined;
	readonly minLength?: number | undefined;
	readonly validValues?: string[] | undefined;
}

/**
 * A scalar value allowed inside an attribute value.
 */
type AttributePrimitive = boolean | number | string;

/**
 * A schema-driven record of attribute values keyed by field name.
 */
interface AttributeRecord {
	readonly [key: string]: AttributeValue;
}

/**
 * A named type for attribute values.
 *
 * Values are recursive: scalars, arrays of scalars, typed records, and arrays
 * of records. Records are schema-driven; opaque JSON is not an attribute value.
 */
type AttributeValue = AttributePrimitive | AttributePrimitive[] | AttributeRecord | AttributeRecord[];

/**
 * A plain record of attribute values keyed by attribute key.
 */
type AttributeValues = Record<string, AttributeValue>;

/**
 * Plain-object form of {@link AttributeDefinition}, used to build and persist definitions.
 */
interface AttributeDefinitionPrimitives {
	readonly constraints: AttributeConstraintsPrimitives;
	readonly defaultValue?: AttributeValue | undefined;
	readonly key: string;
	readonly required?: boolean | undefined;
	readonly type: AttributeType;
}

/**
 * A catalog-owned definition that declares the key, type, default value,
 * and optional constraints for a reusable project-level attribute.
 *
 * AttributeDefinitions are the schema layer of the attribute system. They
 * describe *what kind* of data an attribute holds and how to validate it.
 * Individual entities (Species, Moves, Abilities, Creatures) then carry
 * {@link AttributeMap}s whose values must conform to these definitions.
 *
 * Definitions are recursive: a `record` definition declares its nested
 * `fields`, and an `array` may declare an `itemDefinition` to hold records.
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
 * // A typed record with nested defaults
 * const secondaryDef = AttributeDefinition.create({
 *   key: 'secondary', type: 'record', defaultValue: {},
 *   constraints: {
 *     fields: [
 *       AttributeDefinition.create({ key: 'chance', type: 'number', defaultValue: 100 }),
 *     ],
 *   },
 * });
 *
 * // Validate a raw value at runtime
 * const error = hpDef.validateValue(300);
 * // error.message === 'Value 300 exceeds maximum 255'
 * ```
 */
export default class AttributeDefinition {
	/**
	 *Optional constraints that govern valid values (ranges, allowed values, nested fields, etc.).
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

	private constructor(primitives: AttributeDefinitionPrimitives) {
		const { constraints, defaultValue, key, required, type } = primitives;
		this.constraints = AttributeDefinition.hydrateConstraints(constraints);
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
	 * for enums, `itemType`/`itemDefinition` for arrays, `fields` for records)
	 * must be present. Nested `fields` and `itemDefinition` are validated recursively.
	 *
	 * @param primitives - Plain object with `key`, `type`, `defaultValue`, and `constraints`.
	 * @returns A fully validated AttributeDefinition.
	 * @throws {InvalidArgumentError} When the definition is structurally invalid
	 *         or the default value fails its own validation.
	 */
	static create(primitives: AttributeDefinitionPrimitives): AttributeDefinition {
		const definition = new AttributeDefinition(primitives);
		definition.validateDefinition();

		return definition;
	}

	/**
	 * Hydrates an AttributeDefinition from primitives without re-validating.
	 *
	 * Use this when reconstructing from a persistence layer where the definition
	 * was already validated at write time. Nested `fields` and `itemDefinition`
	 * are hydrated recursively as AttributeDefinition instances.
	 *
	 * @param primitives - Plain object with `key`, `type`, `defaultValue`, and `constraints`.
	 * @returns A rehydrated AttributeDefinition.
	 */
	static fromPrimitives(primitives: AttributeDefinitionPrimitives): AttributeDefinition {
		return new AttributeDefinition(primitives);
	}

	/**
	 * Checks whether a raw value is a plain record suitable for a record attribute.
	 *
	 * Rejects `null`, arrays, and class instances so record attributes only hold
	 * schema-driven, serializable objects.
	 *
	 * @param value - The raw value to inspect.
	 * @returns `true` when the value is a plain record.
	 */
	static isRecordValue(value: unknown): value is AttributeRecord {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			return false;
		}

		const prototype: null | object = Reflect.getPrototypeOf(value);

		return prototype === Object.prototype || prototype === null;
	}

	private static describeValue(value: unknown): string {
		if (Array.isArray(value)) {
			return 'array';
		}

		if (value === null) {
			return 'null';
		}

		return typeof value;
	}

	private static hydrateConstraints(constraints: AttributeConstraintsPrimitives): AttributeConstraints {
		const { fields, itemDefinition, ...flat } = constraints;

		return {
			...flat,
			...(fields !== undefined && { fields: fields.map(field => this.fromPrimitives(field)) }),
			...(itemDefinition !== undefined && {
				itemDefinition: this.fromPrimitives(itemDefinition),
			}),
		};
	}

	private static joinPath(path: string, segment: number | string): string {
		return path === '' ? String(segment) : `${path}.${String(segment)}`;
	}

	private static messageAt(path: string, message: string): string {
		return path === '' ? message : `Field "${path}": ${message}`;
	}

	toPrimitives(): AttributeDefinitionPrimitives {
		const { fields, itemDefinition, ...flat } = this.constraints;

		return {
			constraints: {
				...flat,
				...(fields !== undefined && { fields: fields.map(field => field.toPrimitives()) }),
				...(itemDefinition !== undefined && { itemDefinition: itemDefinition.toPrimitives() }),
			},
			defaultValue: this.defaultValue,
			key: this.key,
			required: this.required,
			type: this.type,
		};
	}

	/**
	 * Validates a raw value against this definition's type and constraints.
	 *
	 * Validation is recursive for records and arrays of records. Nested errors
	 * include their dotted path relative to this attribute, for example
	 * `Field "boosts.attack": Value 12 exceeds maximum 6`. Root-level messages
	 * keep their original text.
	 *
	 * @param value - The raw value to validate.
	 * @returns An {@link InvalidArgumentError} describing the violation,
	 *          or `undefined` if the value is valid.
	 */
	validateValue(value: unknown): InvalidArgumentError | undefined {
		return this.validate(value, '');
	}

	private validate(value: unknown, path: string): InvalidArgumentError | undefined {
		switch (this.type) {
			case 'array': {
				return this.validateArray(value, path);
			}
			case 'boolean': {
				return this.validateBoolean(value, path);
			}
			case 'enum': {
				return this.validateEnum(value, path);
			}
			case 'number': {
				return this.validateNumber(value, path);
			}
			case 'record': {
				return this.validateRecord(value, path);
			}
			case 'string': {
				return this.validateString(value, path);
			}
		}
	}

	private validateArray(value: unknown, path: string): InvalidArgumentError | undefined {
		if (!Array.isArray(value)) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected array, got ${typeof value}`),
				'AttributeDefinition'
			);
		}
		if (this.constraints.minLength !== undefined && value.length < this.constraints.minLength) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`Array length ${String(value.length)} is below minimum ${String(this.constraints.minLength)}`
				),
				'AttributeDefinition'
			);
		}
		if (this.constraints.maxLength !== undefined && value.length > this.constraints.maxLength) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`Array length ${String(value.length)} exceeds maximum ${String(this.constraints.maxLength)}`
				),
				'AttributeDefinition'
			);
		}

		const { itemDefinition, itemType } = this.constraints;
		for (const [index, element] of value.entries()) {
			const itemPath = AttributeDefinition.joinPath(path, index);

			if (itemDefinition) {
				const itemError = itemDefinition.validate(element, itemPath);
				if (itemError) {
					return itemError;
				}
				continue;
			}

			// eslint-disable-next-line valid-typeof
			if (typeof element !== itemType) {
				return new InvalidArgumentError(
					AttributeDefinition.messageAt(
						itemPath,
						`Array item at index ${String(index)} expected ${String(itemType)}, got ${typeof element}`
					),
					'AttributeDefinition'
				);
			}
		}

		return undefined;
	}

	private validateBoolean(value: unknown, path: string): InvalidArgumentError | undefined {
		if (typeof value !== 'boolean') {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected boolean, got ${typeof value}`),
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateDefinition(): void {
		if (!this.key || typeof this.key !== 'string') {
			throw new InvalidArgumentError('AttributeDefinition key must be a non-empty string', 'AttributeDefinition');
		}

		const validTypes: AttributeType[] = ['array', 'boolean', 'enum', 'number', 'record', 'string'];
		if (!validTypes.includes(this.type)) {
			throw new InvalidArgumentError(
				`AttributeDefinition type must be one of: ${validTypes.join(', ')}`,
				'AttributeDefinition'
			);
		}

		this.validateStructuralConstraints();

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
	}

	private validateEnum(value: unknown, path: string): InvalidArgumentError | undefined {
		if (typeof value !== 'string') {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected string for enum, got ${typeof value}`),
				'AttributeDefinition'
			);
		}
		if (!this.constraints.validValues?.includes(value)) {
			const allowed = String(this.constraints.validValues?.join(', '));

			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`"${value}" is not a valid value for attribute "${this.key}". Allowed: ${allowed}`
				),
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateNumber(value: unknown, path: string): InvalidArgumentError | undefined {
		if (typeof value !== 'number' || Number.isNaN(value)) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected number, got ${typeof value}`),
				'AttributeDefinition'
			);
		}
		if (this.constraints.min !== undefined && value < this.constraints.min) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`Value ${String(value)} is below minimum ${String(this.constraints.min)}`
				),
				'AttributeDefinition'
			);
		}
		if (this.constraints.max !== undefined && value > this.constraints.max) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`Value ${String(value)} exceeds maximum ${String(this.constraints.max)}`
				),
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateRecord(value: unknown, path: string): InvalidArgumentError | undefined {
		if (!AttributeDefinition.isRecordValue(value)) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected record, got ${AttributeDefinition.describeValue(value)}`),
				'AttributeDefinition'
			);
		}

		const fields = this.constraints.fields ?? [];
		const declared = new Set(fields.map(field => field.key));

		for (const key of Object.keys(value)) {
			if (!declared.has(key)) {
				const keyPath = AttributeDefinition.joinPath(path, key);

				return new InvalidArgumentError(`Field "${keyPath}" is not a declared field`, 'AttributeDefinition');
			}
		}

		for (const field of fields) {
			const fieldPath = AttributeDefinition.joinPath(path, field.key);
			const fieldValue = value[field.key];

			if (fieldValue === undefined) {
				if (field.required === true && field.defaultValue === undefined) {
					return new InvalidArgumentError(
						`Field "${fieldPath}" is required but no value or default was provided`,
						'AttributeDefinition'
					);
				}
				continue;
			}

			const fieldError = field.validate(fieldValue, fieldPath);
			if (fieldError) {
				return fieldError;
			}
		}

		return undefined;
	}

	private validateString(value: unknown, path: string): InvalidArgumentError | undefined {
		if (typeof value !== 'string') {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(path, `Expected string, got ${typeof value}`),
				'AttributeDefinition'
			);
		}
		if (this.constraints.minLength !== undefined && value.length < this.constraints.minLength) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`String length ${String(value.length)} is below minimum ${String(this.constraints.minLength)}`
				),
				'AttributeDefinition'
			);
		}
		if (this.constraints.maxLength !== undefined && value.length > this.constraints.maxLength) {
			return new InvalidArgumentError(
				AttributeDefinition.messageAt(
					path,
					`String length ${String(value.length)} exceeds maximum ${String(this.constraints.maxLength)}`
				),
				'AttributeDefinition'
			);
		}

		return undefined;
	}

	private validateStructuralConstraints(): void {
		const { fields, itemDefinition } = this.constraints;

		if (this.type === 'record') {
			if (!fields || fields.length === 0) {
				throw new InvalidArgumentError(
					'AttributeDefinition of type "record" must have a non-empty fields constraint',
					'AttributeDefinition'
				);
			}

			const keys = new Set<string>();
			for (const field of fields) {
				if (keys.has(field.key)) {
					throw new InvalidArgumentError(
						`AttributeDefinition of type "record" has a duplicated field key "${field.key}"`,
						'AttributeDefinition'
					);
				}
				keys.add(field.key);
				field.validateDefinition();
			}
		} else if (fields) {
			throw new InvalidArgumentError(
				`AttributeDefinition of type "${this.type}" cannot have a fields constraint`,
				'AttributeDefinition'
			);
		}

		if (this.type === 'array') {
			if (!itemDefinition && !this.constraints.itemType) {
				throw new InvalidArgumentError(
					'AttributeDefinition of type "array" must have an itemType or itemDefinition constraint',
					'AttributeDefinition'
				);
			}
			if (itemDefinition && this.constraints.itemType) {
				throw new InvalidArgumentError(
					'AttributeDefinition of type "array" cannot have both itemType and itemDefinition constraints',
					'AttributeDefinition'
				);
			}
			if (itemDefinition && itemDefinition.type !== 'record') {
				throw new InvalidArgumentError(
					'AttributeDefinition of type "array" must use a record itemDefinition constraint',
					'AttributeDefinition'
				);
			}
			itemDefinition?.validateDefinition();
		} else if (itemDefinition) {
			throw new InvalidArgumentError(
				`AttributeDefinition of type "${this.type}" cannot have an itemDefinition constraint`,
				'AttributeDefinition'
			);
		}

		if (this.type === 'enum' && (!this.constraints.validValues || this.constraints.validValues.length === 0)) {
			throw new InvalidArgumentError(
				'AttributeDefinition of type "enum" must have validValues constraint',
				'AttributeDefinition'
			);
		}
	}
}

export type {
	AttributeConstraints,
	AttributeConstraintsPrimitives,
	AttributeDefinitionPrimitives,
	AttributePrimitive,
	AttributeRecord,
	AttributeType,
	AttributeValue,
	AttributeValues,
};
