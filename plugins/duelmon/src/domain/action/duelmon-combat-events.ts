import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import type { DuelmonTargetScope } from './duelmon-target';
import type { DuelmonOperation } from './modify-attribute/modify-attribute.config';

/**
 * Stable event type identifiers emitted by Duelmon actions.
 */
const DUELMON_COMBAT_EVENT_TYPES = {
	attributeModificationFailed: 'attribute-modification-failed',
	attributeModified: 'attribute-modified',
	moveMissed: 'move-missed',
	moveUsed: 'move-used',
} as const;

/**
 * Event types emitted by Duelmon actions.
 */
type DuelmonCombatEventType = (typeof DUELMON_COMBAT_EVENT_TYPES)[keyof typeof DUELMON_COMBAT_EVENT_TYPES];

/**
 * Payload of the `move-used` event.
 */
interface MoveUsedPayload extends AttributeValues {
	readonly actionId: string;
	readonly attackerId: string;
	readonly damage: number;
	readonly effectiveness: number;
	readonly moveId: string;
	readonly targetId: string;
}

/**
 * Payload of the `move-missed` event.
 */
interface MoveMissedPayload extends AttributeValues {
	readonly actionId: string;
	readonly attackerId: string;
	readonly moveId: string;
	readonly targetId: string;
}

/**
 * Payload of the `attribute-modified` event.
 */
interface AttributeModifiedPayload extends AttributeValues {
	readonly actionId: string;
	readonly after: AttributeValue;
	readonly attributeKey: string;
	readonly before?: AttributeValue;
	readonly operation: DuelmonOperation;
	readonly scope: DuelmonTargetScope;
	readonly targetId?: string;
}

/**
 * Payload of the `attribute-modification-failed` event.
 */
interface AttributeModificationFailedPayload extends AttributeValues {
	readonly actionId: string;
	readonly attributeKey: string;
	readonly probability: number;
	readonly scope: DuelmonTargetScope;
	readonly targetId?: string;
}

declare module '@pocket-forge/combat-engine/domain' {
	interface CombatEventMap {
		'attribute-modification-failed': AttributeModificationFailedPayload;
		'attribute-modified': AttributeModifiedPayload;
		'move-missed': MoveMissedPayload;
		'move-used': MoveUsedPayload;
	}
}

/**
 * Event emitted after a Move resolves.
 */
type MoveUsedEvent = CombatEvent<'move-used', MoveUsedPayload>;

/**
 * Event emitted when a Move misses.
 */
type MoveMissedEvent = CombatEvent<'move-missed', MoveMissedPayload>;

/**
 * Event emitted after a successful attribute modification.
 */
type AttributeModifiedEvent = CombatEvent<'attribute-modified', AttributeModifiedPayload>;

/**
 * Event emitted when an attribute modification is rejected by probability.
 */
type AttributeModificationFailedEvent = CombatEvent<
	'attribute-modification-failed',
	AttributeModificationFailedPayload
>;

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

export type {
	AttributeModificationFailedEvent,
	AttributeModificationFailedPayload,
	AttributeModifiedEvent,
	AttributeModifiedPayload,
	DuelmonCombatEvent,
	DuelmonCombatEventType,
	MoveMissedEvent,
	MoveMissedPayload,
	MoveUsedEvent,
	MoveUsedPayload,
};
export { DUELMON_COMBAT_EVENT_TYPES, DuelmonCombatEvents };
