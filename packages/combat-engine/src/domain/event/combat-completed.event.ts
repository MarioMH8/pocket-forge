import type { CombatOutcome } from '../combat-outcome';
import COMBAT_EVENT_TYPES from './catalog';
import type { CombatEvent } from './combat-event';

/**
 * Payload of the `combat-completed` event.
 */
type CombatCompletedPayload =
	{ readonly status: 'draw' } | { readonly status: 'victory'; readonly winnerGroupId: string };

/**
 * Event emitted when a Combat reaches an outcome.
 */
type CombatCompletedEvent = CombatEvent<typeof COMBAT_EVENT_TYPES.combatCompleted, CombatCompletedPayload>;

/**
 * Builds the `combat-completed` event for an outcome.
 *
 * @param outcome - Reached outcome.
 * @param sequence - Position of the event inside its transition.
 * @returns The serializable completion event.
 */
function buildCombatCompletedEvent(outcome: CombatOutcome, sequence: number): CombatCompletedEvent {
	return {
		payload:
			outcome.status === 'victory'
				? { status: 'victory', winnerGroupId: outcome.winnerGroupId }
				: { status: 'draw' },
		sequence,
		type: COMBAT_EVENT_TYPES.combatCompleted,
	};
}

export type { CombatCompletedEvent, CombatCompletedPayload };
export { buildCombatCompletedEvent };
