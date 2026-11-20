import type { CombatOutcome } from '../combat-outcome';
import type { CombatCompletedEvent } from './combat-completed.event';
import { buildCombatCompletedEvent } from './combat-completed.event';

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
		return buildCombatCompletedEvent(outcome, sequence);
	}
}

export default CombatEvents;
