import type { AttributeValues } from '@pocket-forge/attribute/domain';

import type { CombatOutcome } from '../combat-outcome';
import COMBAT_EVENT_TYPES from './catalog';
import type { CombatCompletedEvent } from './combat-completed.event';

/**
 * Ordered, serializable event emitted by a resolved Combat Transition.
 *
 * @typeParam TType - Stable event type identifier.
 * @typeParam TPayload - Serializable event data. Defaults to plain attribute values.
 */
interface CombatEvent<TType extends string = string, TPayload extends AttributeValues = AttributeValues> {
	/**
	 * Serializable event data.
	 */
	readonly payload: TPayload;
	/**
	 * Position of the event inside its transition, starting at one.
	 */
	readonly sequence: number;
	/**
	 * Stable event type identifier defined by the plugin.
	 */
	readonly type: TType;
}

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
export { type CombatEvent };
