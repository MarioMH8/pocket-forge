import type { AttributeDefinition, AttributeMap, AttributeValues } from '@pocket-forge/attribute/domain';

import type CombatGroupConstraints from './combat-group-constraints';

/**
 * Plain, serializable representation of an authored Combat Ruleset.
 *
 * It carries format identity and generic composition constraints only. Move
 * bindings, action configuration, and plugin references belong to other
 * models.
 */
interface CombatRulesetPrimitives {
	/**
	 * Format-level attribute values shared with the Attribute domain.
	 */
	readonly attributes: AttributeValues;
	/**
	 * Exact semver version of the concrete ruleset implementation.
	 */
	readonly contractVersion: string;
	/**
	 * Composition constraints declared by the concrete format.
	 */
	readonly groupConstraints: CombatGroupConstraints;
	/**
	 * Unique ruleset identifier.
	 */
	readonly id: string;
	/**
	 * Concrete format identifier.
	 */
	readonly kind: string;
	/**
	 * Human-readable ruleset name.
	 */
	readonly name: string;
}

/**
 * Internal data produced after a ruleset has been validated.
 *
 * Instances are built from this shape so every ruleset is guaranteed to hold a
 * validated attribute map and constraints.
 */
interface CombatRulesetData {
	/**
	 * Validated attribute values.
	 */
	readonly attributes: AttributeMap;
	/**
	 * Definitions used to validate the attribute values.
	 */
	readonly definitions: readonly AttributeDefinition[];
	/**
	 * Validated composition constraints.
	 */
	readonly groupConstraints: CombatGroupConstraints;
	/**
	 * Unique ruleset identifier.
	 */
	readonly id: string;
	/**
	 * Human-readable ruleset name.
	 */
	readonly name: string;
}

export type { CombatRulesetData, CombatRulesetPrimitives };
