import type { CombatOutcome } from '../combat-outcome';
import COMBAT_EVENT_TYPES from './catalog';
import type { CombatCompletedEvent } from './combat-completed.event';

/**
 * Builders for the events emitted by the Combat Engine.
 */
class CombatEvents {
	/**
	 * Builds the `combat-completed` event for an outcome.
	 *
	 * @param outcome - Reached outcome.
	 * @param sequence - Position of the event inside its transition.
	 * @returns The serializable completion event.
	 */
	static completed(outcome: CombatOutcome, sequence: number): CombatCompletedEvent {
		return {
			payload:
				outcome.status === 'victory'
					? { status: 'victory', winnerGroupId: outcome.winnerGroupId }
					: { status: 'draw' },
			sequence,
			type: COMBAT_EVENT_TYPES.combatCompleted,
		};
	}
}

export default CombatEvents;
