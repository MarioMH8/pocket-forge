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
class CombatResolution {
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

	private constructor(combat: Combat, events: readonly CombatEvent[], outcome: CombatOutcome | undefined) {
		this.combat = combat;
		this.events = Object.freeze([...events]);
		this.outcome = outcome;
		Object.freeze(this);
	}

	/**
	 * Creates an immutable resolution.
	 *
	 * @param combat - Successor Combat snapshot.
	 * @param events - Ordered events produced by the resolution.
	 * @param outcome - Reached outcome, or `undefined` while combat continues.
	 * @returns The immutable resolution.
	 */
	static create(combat: Combat, events: readonly CombatEvent[], outcome?: CombatOutcome): CombatResolution {
		return new CombatResolution(combat, events, outcome);
	}
}

export default CombatResolution;
