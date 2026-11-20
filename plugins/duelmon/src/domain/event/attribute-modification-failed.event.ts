import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import type { DuelmonTargetScope } from '../action/duelmon-target';
import { DUELMON_COMBAT_EVENT_TYPES } from './catalog';

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
	}
}

/**
 * Event emitted when an attribute modification is rejected by probability.
 */
type AttributeModificationFailedEvent = CombatEvent<
	typeof DUELMON_COMBAT_EVENT_TYPES.attributeModificationFailed,
	AttributeModificationFailedPayload
>;

/**
 * Builds an `attribute-modification-failed` event.
 *
 * @param payload - Failed modification data.
 * @param sequence - Position of the event inside its transition.
 * @returns The serializable failure event.
 */
function buildAttributeModificationFailedEvent(
	payload: AttributeModificationFailedPayload,
	sequence: number
): AttributeModificationFailedEvent {
	return {
		payload,
		sequence,
		type: DUELMON_COMBAT_EVENT_TYPES.attributeModificationFailed,
	};
}

export type { AttributeModificationFailedEvent, AttributeModificationFailedPayload };
export { buildAttributeModificationFailedEvent };
