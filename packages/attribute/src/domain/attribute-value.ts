import type { AttributeRecord } from './attribute-definition';

/**
 * Checks whether a value is a plain record suitable for a record attribute.
 *
 * Rejects `null`, arrays, and class instances so record attributes only hold
 * schema-driven, serializable objects.
 *
 * @param value - The raw value to inspect.
 * @returns `true` when the value is a plain record.
 */
function isAttributeRecord(value: unknown): value is AttributeRecord {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const prototype: null | object = Reflect.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
}

export default isAttributeRecord;
