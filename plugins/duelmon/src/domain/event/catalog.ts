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

export type { DuelmonCombatEventType };
export { DUELMON_COMBAT_EVENT_TYPES };
