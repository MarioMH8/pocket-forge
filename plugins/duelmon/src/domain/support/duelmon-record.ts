type UnknownRecord = Record<string, unknown>;

/**
 * Runtime guards for plain record values shared by Duelmon support modules.
 */
class DuelmonRecord {
	/**
	 * Checks whether a value is a plain object record.
	 *
	 * @param value - Value to inspect.
	 * @returns `true` when the value is a non-null, non-array object.
	 */
	static isRecord(value: unknown): value is UnknownRecord {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}
}

export type { UnknownRecord };
export { DuelmonRecord };

export default DuelmonRecord;
