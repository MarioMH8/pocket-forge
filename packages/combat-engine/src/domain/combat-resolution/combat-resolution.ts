import type { Combat } from '@pocket-forge/combat/domain';

import type { CombatOutcome } from '../combat-outcome';
import type { CombatEvent } from '../event/combat-event';

/**
 * Result of resolving one action through the Combat Engine.
 *
 * It carries the successor Combat snapshot, the ordered events produced while
 * resolving it, and the reached outcome when the completion rule ended the
 * combat.
 */
export default interface CombatResolution {
	/**
	 * Successor snapshot, including the advanced RandomPocket.
	 */
	readonly combat: Combat;
	/**
	 * Ordered, serializable events produced by the resolution.
	 */
	readonly events: readonly CombatEvent[];
	/**
	 * Reached outcome, or `undefined` while combat continues.
	 */
	readonly outcome: CombatOutcome | undefined;
}
