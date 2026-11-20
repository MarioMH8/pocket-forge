import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import type { DuelmonTargetScope } from '../action/duelmon-target';
import type { DuelmonOperation } from '../action/modify-attribute/modify-attribute.config';
import { DUELMON_COMBAT_EVENT_TYPES } from './catalog';

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

declare module '@pocket-forge/combat-engine/domain' {
	interface CombatEventMap {
		'attribute-modified': AttributeModifiedPayload;
	}
}

/**
 * Event emitted after a successful attribute modification.
 */
type AttributeModifiedEvent = CombatEvent<
	typeof DUELMON_COMBAT_EVENT_TYPES.attributeModified,
	AttributeModifiedPayload
>;

/**
 * Builds an `attribute-modified` event.
 *
 * @param payload - Successful modification data.
 * @param sequence - Position of the event inside its transition.
 * @returns The serializable modification event.
 */
function buildAttributeModifiedEvent(payload: AttributeModifiedPayload, sequence: number): AttributeModifiedEvent {
	return {
		payload,
		sequence,
		type: DUELMON_COMBAT_EVENT_TYPES.attributeModified,
	};
}

export type { AttributeModifiedEvent, AttributeModifiedPayload };
export { buildAttributeModifiedEvent };
