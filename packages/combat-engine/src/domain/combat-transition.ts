import type { Combat } from '@pocket-forge/combat/domain';

import type { CombatEvent } from './combat-event';

/**
 * Immutable result of a plugin-resolved combat action.
 *
 * A transition carries the successor Combat snapshot and the ordered events
 * produced while resolving it. Combat keeps no event history.
 */
export default interface CombatTransition {
	/**
	 * Successor snapshot, including the advanced RandomPocket.
	 */
	readonly combat: Combat;
	/**
	 * Ordered, serializable events produced by the transition.
	 */
	readonly events: readonly CombatEvent[];
}
