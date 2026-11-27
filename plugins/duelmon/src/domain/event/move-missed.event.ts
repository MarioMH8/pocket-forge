import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import { DUELMON_COMBAT_EVENT_TYPES } from './catalog';

/**
 * Payload of the `move-missed` event.
 */
interface MoveMissedPayload extends AttributeValues {
	readonly actionId: string;
	readonly attackerId: string;
	readonly moveId: string;
	readonly targetId: string;
}

declare module '@pocket-forge/combat-engine/domain' {
	interface CombatEventMap {
		'move-missed': MoveMissedPayload;
	}
}

/**
 * Event emitted when a Move misses.
 */
type MoveMissedEvent = CombatEvent<typeof DUELMON_COMBAT_EVENT_TYPES.moveMissed, MoveMissedPayload>;

export type { MoveMissedEvent, MoveMissedPayload };
