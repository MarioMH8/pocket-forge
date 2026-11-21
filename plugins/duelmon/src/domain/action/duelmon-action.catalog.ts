import type { CombatActionCatalog, CombatActionDescriptor } from '@pocket-forge/combat-engine/domain';

import type DuelmonAction from './duelmon-action';

/**
 * Catalog of actions registered by the Duelmon Combat plugin.
 *
 * Descriptors come from the registered actions, so the catalog never drifts
 * from the resolver map built by the plugin.
 */
class DuelmonActionCatalog implements CombatActionCatalog {
	private readonly descriptors: readonly CombatActionDescriptor[];

	constructor(actions: readonly DuelmonAction[]) {
		this.descriptors = actions.map(action => action.descriptor);
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

export { DuelmonActionCatalog };

export default DuelmonActionCatalog;
