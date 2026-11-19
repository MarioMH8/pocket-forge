import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatPrimitives } from '@pocket-forge/combat/domain';

import type { ResolvedDuelmonTarget } from './duelmon-target';

/**
 * Numeric attribute reads and writes shared by Duelmon actions.
 */
class DuelmonCombatAttributes {
	/**
	 * Reads a finite numeric attribute from a primitive attribute record.
	 *
	 * @param values - Primitive attribute values.
	 * @param key - Attribute key.
	 * @returns The numeric value, or `undefined` when it is absent or invalid.
	 */
	static readNumber(values: AttributeValues, key: string): number | undefined {
		const value = values[key];

		return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
	}

	/**
	 * Resolves the numeric value currently stored for an attribute.
	 *
	 * @param raw - Current raw attribute value.
	 * @param definition - Definition that governs the attribute.
	 * @returns The current number, the definition default, or zero.
	 */
	static resolveNumeric(raw: AttributeValue | undefined, definition: AttributeDefinition): number {
		if (typeof raw === 'number') {
			return raw;
		}

		if (typeof definition.defaultValue === 'number') {
			return definition.defaultValue;
		}

		return 0;
	}

	/**
	 * Clamps a numeric attribute value to its definition constraints.
	 *
	 * @param value - Candidate value.
	 * @param definition - Definition that governs the attribute.
	 * @returns The value inside the declared minimum and maximum.
	 */
	static saturate(value: number, definition: AttributeDefinition): number {
		const { max, min } = definition.constraints;
		let result = value;

		if (min !== undefined && result < min) {
			result = min;
		}

		if (max !== undefined && result > max) {
			result = max;
		}

		return result;
	}

	/**
	 * Replaces one attribute on a resolved target.
	 *
	 * @param primitives - Combat primitives to copy.
	 * @param target - Target that owns the attribute and its write path.
	 * @param attributeKey - Attribute key.
	 * @param value - Replacement value.
	 * @returns A new primitives snapshot with the replacement applied.
	 */
	static update(
		primitives: CombatPrimitives,
		target: ResolvedDuelmonTarget,
		attributeKey: string,
		value: AttributeValue
	): CombatPrimitives {
		return target.writeAttribute(primitives, attributeKey, value);
	}
}

export { DuelmonCombatAttributes };

export default DuelmonCombatAttributes;
