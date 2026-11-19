import type { CombatActionCatalog, CombatActionDescriptor } from '@pocket-forge/combat/domain';

import { MODIFY_ATTRIBUTE_ACTION_ID } from './duelmon.constants';
import { MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS, validateModifyAttributeConfig } from './modify-attribute.config';

/**
 * Declares the Duelmon attribute-modification action.
 */
const MODIFY_ATTRIBUTE_DESCRIPTOR: CombatActionDescriptor = {
	configDefinitions: MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	id: MODIFY_ATTRIBUTE_ACTION_ID,
	validateConfig: validateModifyAttributeConfig,
};

/**
 * Catalog of actions registered by the Duelmon Combat plugin.
 */
class DuelmonActionCatalog implements CombatActionCatalog {
	private readonly descriptors: readonly CombatActionDescriptor[];

	constructor(descriptors: readonly CombatActionDescriptor[] = [MODIFY_ATTRIBUTE_DESCRIPTOR]) {
		this.descriptors = descriptors;
	}

	/**
	 * Finds the descriptor registered for an action.
	 *
	 * @param actionId - Action identifier declared by a ruleset binding.
	 * @returns The matching descriptor, or `undefined` when the action is unknown.
	 */
	find(actionId: string): CombatActionDescriptor | undefined {
		return this.descriptors.find(descriptor => descriptor.id === actionId);
	}
}

export { MODIFY_ATTRIBUTE_DESCRIPTOR };
export default DuelmonActionCatalog;
