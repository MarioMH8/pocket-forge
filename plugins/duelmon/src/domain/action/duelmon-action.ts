import type { CombatActionDescriptor } from '@pocket-forge/combat/domain';

import type DuelmonActionResolver from './duelmon-action.resolver';

/**
 * One action registered by the Duelmon Combat plugin.
 *
 * An action owns its identifier, its catalog descriptor, and its resolver, so
 * adding an action only requires adding one class to the plugin's action list.
 */
export default interface DuelmonAction extends DuelmonActionResolver {
	/**
	 * Descriptor that declares the action configuration schema.
	 */
	readonly descriptor: CombatActionDescriptor;
	/**
	 * Stable action identifier used by ruleset bindings.
	 */
	readonly id: string;
}
