import type { Combat } from '@pocket-forge/combat/domain';

import type { CombatEvent } from './event/combat-event';

/**
 * Immutable result of a plugin-resolved combat action.
 *
 * A transition carries the successor Combat snapshot and the ordered events
 * produced while resolving it. Combat keeps no event history.
 */
class CombatTransition {
	/**
	 * Successor snapshot, including the advanced RandomPocket.
	 */
	readonly combat: Combat;
	/**
	 * Ordered, serializable events produced by the transition.
	 */
	readonly events: readonly CombatEvent[];

	private constructor(combat: Combat, events: readonly CombatEvent[]) {
		this.combat = combat;
		this.events = Object.freeze([...events]);
		Object.freeze(this);
	}

	/**
	 * Creates an immutable transition from its successor and events.
	 *
	 * @param combat - Successor Combat snapshot.
	 * @param events - Ordered events produced while resolving.
	 * @returns The immutable transition.
	 */
	static create(combat: Combat, events: readonly CombatEvent[]): CombatTransition {
		return new CombatTransition(combat, events);
	}
}

export default CombatTransition;
