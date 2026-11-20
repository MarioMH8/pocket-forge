import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Declaration of a single executable action registered by a Combat Action
 * Resolver.
 *
 * Descriptors are catalog-owned: they declare the configuration schema of an
 * action and never embed Move-specific rules in the Combat core.
 */
interface CombatActionDescriptor {
	/**
	 * Definitions that govern the action configuration values.
	 */
	readonly configDefinitions: readonly AttributeDefinition[];
	/**
	 * Stable action identifier used by Move bindings.
	 */
	readonly id: string;
	/**
	 * Optional cross-field validation for the resolved action configuration.
	 *
	 * @param config - Validated configuration values, including defaults.
	 * @returns Human-readable validation messages, or an empty list.
	 */
	readonly validateConfig?: ((config: AttributeValues) => string[]) | undefined;
}

/**
 * Lookup surface exposed by a Combat Action Resolver.
 */
interface CombatActionCatalog {
	/**
	 * Finds the descriptor registered for an action.
	 *
	 * @param actionId - Action identifier declared by a Move binding.
	 * @returns The matching descriptor, or `undefined` when the action is unknown.
	 */
	find(actionId: string): CombatActionDescriptor | undefined;
}

export type { CombatActionCatalog, CombatActionDescriptor };
