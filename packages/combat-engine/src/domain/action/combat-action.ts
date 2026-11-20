import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Declaration of a single executable action registered by a Combat Action
 * Resolver.
 *
 * Descriptors are catalog-owned: they declare the configuration schema of an
 * action and never embed Move-specific rules in the Combat core.
 */
class CombatActionDescriptor {
	/**
	 * Definitions that govern the action configuration values.
	 */
	readonly configDefinitions: readonly AttributeDefinition[];
	/**
	 * Stable action identifier used by Move bindings.
	 */
	readonly id: string;
	private readonly validateConfig?: ((config: AttributeValues) => string[]) | undefined;

	private constructor(
		id: string,
		configDefinitions: readonly AttributeDefinition[],
		validateConfig?: (config: AttributeValues) => string[]
	) {
		this.configDefinitions = Object.freeze([...configDefinitions]);
		this.id = id;
		this.validateConfig = validateConfig;
		Object.freeze(this);
	}

	/**
	 * Creates an action descriptor.
	 *
	 * @param id - Stable action identifier used by Move bindings.
	 * @param configDefinitions - Definitions that govern the configuration values.
	 * @param validateConfig - Optional cross-field validation for the configuration.
	 * @returns The immutable action descriptor.
	 */
	static create(
		id: string,
		configDefinitions: readonly AttributeDefinition[] = [],
		validateConfig?: (config: AttributeValues) => string[]
	): CombatActionDescriptor {
		return new CombatActionDescriptor(id, configDefinitions, validateConfig);
	}

	/**
	 * Validates the resolved action configuration.
	 *
	 * @param config - Validated configuration values, including defaults.
	 * @returns Human-readable validation messages, or an empty list.
	 */
	validate(config: AttributeValues): string[] {
		return this.validateConfig?.(config) ?? [];
	}
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

export type { CombatActionCatalog };
export default CombatActionDescriptor;
