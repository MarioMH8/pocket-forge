import type {
	AttributeModificationFailedEvent,
	AttributeModificationFailedPayload,
} from './attribute-modification-failed.event';
import type { AttributeModifiedEvent, AttributeModifiedPayload } from './attribute-modified.event';
import { DUELMON_COMBAT_EVENT_TYPES } from './duelmon-combat-event-catalog';
import type { MoveMissedEvent, MoveMissedPayload } from './move-missed.event';
import type { MoveUsedEvent, MoveUsedPayload } from './move-used.event';

/**
 * Events emitted by Duelmon actions.
 */
type DuelmonCombatEvent = AttributeModificationFailedEvent | AttributeModifiedEvent | MoveMissedEvent | MoveUsedEvent;

/**
 * Builders for the events emitted by Duelmon actions.
 */
class DuelmonCombatEvents {
	/**
	 * Builds an `attribute-modification-failed` event.
	 *
	 * @param payload - Failed modification data.
	 * @param sequence - Position of the event inside its transition.
	 * @returns The serializable failure event.
	 */
	static attributeModificationFailed(
		payload: AttributeModificationFailedPayload,
		sequence: number
	): AttributeModificationFailedEvent {
		return {
			payload,
			sequence,
			type: DUELMON_COMBAT_EVENT_TYPES.attributeModificationFailed,
		};
	}

	/**
	 * Builds an `attribute-modified` event.
	 *
	 * @param payload - Successful modification data.
	 * @param sequence - Position of the event inside its transition.
	 * @returns The serializable modification event.
	 */
	static attributeModified(payload: AttributeModifiedPayload, sequence: number): AttributeModifiedEvent {
		return {
			payload,
			sequence,
			type: DUELMON_COMBAT_EVENT_TYPES.attributeModified,
		};
	}

	/**
	 * Builds a `move-missed` event.
	 *
	 * @param payload - Miss data.
	 * @param sequence - Position of the event inside its transition.
	 * @returns The serializable miss event.
	 */
	static moveMissed(payload: MoveMissedPayload, sequence: number): MoveMissedEvent {
		return {
			payload,
			sequence,
			type: DUELMON_COMBAT_EVENT_TYPES.moveMissed,
		};
	}

	/**
	 * Builds a `move-used` event.
	 *
	 * @param payload - Move resolution data.
	 * @param sequence - Position of the event inside its transition.
	 * @returns The serializable move event.
	 */
	static moveUsed(payload: MoveUsedPayload, sequence: number): MoveUsedEvent {
		return {
			payload,
			sequence,
			type: DUELMON_COMBAT_EVENT_TYPES.moveUsed,
		};
	}
}

export type { DuelmonCombatEvent };
export { DuelmonCombatEvents };
