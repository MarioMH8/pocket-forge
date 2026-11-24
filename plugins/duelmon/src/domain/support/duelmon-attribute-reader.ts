import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Reads typed values from an attribute record.
 *
 * The views assume that the catalog or the combat start already validated the
 * attributes. These helpers only narrow the primitive values and report a
 * broken invariant as a programmer error.
 */
class DuelmonAttributeReader {
	/**
	 * Reads a required array attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @param context - Entity description used in the error message.
	 * @returns The array value.
	 * @throws {InvalidArgumentError} When the value is not an array.
	 */
	static array(values: AttributeValues, key: string, context: string): readonly AttributeValue[] {
		const value = values[key];

		if (!Array.isArray(value)) {
			throw new InvalidArgumentError(`${context} requires an array "${key}"`, 'DuelmonAttributeReader');
		}

		return value;
	}

	/**
	 * Reads a required boolean attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @param context - Entity description used in the error message.
	 * @returns The boolean value.
	 * @throws {InvalidArgumentError} When the value is not a boolean.
	 */
	static boolean(values: AttributeValues, key: string, context: string): boolean {
		const value = values[key];

		if (typeof value !== 'boolean') {
			throw new InvalidArgumentError(`${context} requires a boolean "${key}"`, 'DuelmonAttributeReader');
		}

		return value;
	}

	/**
	 * Reads a required numeric attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @param context - Entity description used in the error message.
	 * @returns The numeric value.
	 * @throws {InvalidArgumentError} When the value is not a finite number.
	 */
	static number(values: AttributeValues, key: string, context: string): number {
		const value = values[key];

		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new InvalidArgumentError(`${context} requires a numeric "${key}"`, 'DuelmonAttributeReader');
		}

		return value;
	}

	/**
	 * Reads an optional numeric attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @returns The numeric value, or `undefined` when it is absent.
	 */
	static optionalNumber(values: AttributeValues, key: string): number | undefined {
		const value = values[key];

		return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
	}

	/**
	 * Reads an optional string attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @returns The string value, or `undefined` when it is absent.
	 */
	static optionalString(values: AttributeValues, key: string): string | undefined {
		const value = values[key];

		return typeof value === 'string' ? value : undefined;
	}

	/**
	 * Reads a required string attribute.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @param context - Entity description used in the error message.
	 * @returns The string value.
	 * @throws {InvalidArgumentError} When the value is not a string.
	 */
	static string(values: AttributeValues, key: string, context: string): string {
		const value = values[key];

		if (typeof value !== 'string') {
			throw new InvalidArgumentError(`${context} requires a string "${key}"`, 'DuelmonAttributeReader');
		}

		return value;
	}

	/**
	 * Reads a required array of strings.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @param context - Entity description used in the error message.
	 * @returns The string values.
	 * @throws {InvalidArgumentError} When the value is not an array of strings.
	 */
	static stringArray(values: AttributeValues, key: string, context: string): readonly string[] {
		const value = values[key];

		if (!Array.isArray(value)) {
			throw new InvalidArgumentError(
				`${context} requires an array of strings "${key}"`,
				'DuelmonAttributeReader'
			);
		}

		const strings: string[] = [];

		for (const item of value) {
			if (typeof item !== 'string') {
				throw new InvalidArgumentError(
					`${context} requires an array of strings "${key}"`,
					'DuelmonAttributeReader'
				);
			}

			strings.push(item);
		}

		return strings;
	}
}

export { DuelmonAttributeReader };

export default DuelmonAttributeReader;
