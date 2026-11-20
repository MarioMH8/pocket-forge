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

export type { CombatCompletedEvent, CombatCompletedPayload };
