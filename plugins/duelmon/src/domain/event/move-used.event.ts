import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatEvent } from '@pocket-forge/combat-engine/domain';

import { DUELMON_COMBAT_EVENT_TYPES } from './catalog';

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

declare module '@pocket-forge/combat-engine/domain' {
	interface CombatEventMap {
		'move-used': MoveUsedPayload;
	}
}

/**
 * Event emitted after a Move resolves.
 */
type MoveUsedEvent = CombatEvent<typeof DUELMON_COMBAT_EVENT_TYPES.moveUsed, MoveUsedPayload>;

export type { MoveUsedEvent, MoveUsedPayload };
