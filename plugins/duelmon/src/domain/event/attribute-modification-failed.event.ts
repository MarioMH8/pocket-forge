import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import type { DuelmonTargetScope } from '../support/duelmon-target';
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

export type { AttributeModificationFailedEvent, AttributeModificationFailedPayload };
