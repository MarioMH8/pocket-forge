import type { AttributeDefinition, AttributeMap, AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Plain, serializable representation of a Combat Rule.
 *
 * Rules carry their own configuration. Composition rules extend these
 * primitives with their group constraints.
 */
interface CombatRulePrimitives {
	/**
	 * Authored rule configuration.
	 */
	readonly attributes: AttributeValues;
}

/**
 * Validated data produced by a Combat Rule.
 */
interface CombatRuleData {
	/**
	 * Validated rule configuration.
	 */
	readonly attributes: AttributeMap;
	/**
	 * Definitions that govern {@link CombatRuleData.attributes}.
	 */
	readonly definitions: readonly AttributeDefinition[];
}

export type { CombatRuleData, CombatRulePrimitives };
