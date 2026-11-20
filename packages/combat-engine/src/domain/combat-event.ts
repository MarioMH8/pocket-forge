import type { AttributeValues } from '@pocket-forge/attribute/domain';

import type { CombatOutcome } from './combat-outcome';

/**
 * Stable event type identifiers emitted by the Combat Engine.
 */
const COMBAT_EVENT_TYPES = {
	combatCompleted: 'combat-completed',
} as const;

/**
 * Payload of the `combat-completed` event.
 */
type CombatCompletedPayload =
	{ readonly status: 'draw' } | { readonly status: 'victory'; readonly winnerGroupId: string };

/**
 * Payload map for every Combat event known to the current program.
 *
 * The Combat Engine declares its own events. Plugins extend this interface
 * through module augmentation to register the events they emit, so
 * {@link KnownCombatEvent} stays a single discriminated union.
 */
interface CombatEventMap {
	'combat-completed': CombatCompletedPayload;
}

/**
 * Event type identifiers known to the current program.
 */
type CombatEventType = keyof CombatEventMap;

/**
 * Event emitted when a Combat reaches an outcome.
 */
type CombatCompletedEvent = CombatEvent<'combat-completed', CombatCompletedPayload>;

/**
 * Events emitted by the Combat Engine itself.
 */
type CoreCombatEvent = CombatCompletedEvent;

/**
 * Discriminated union of every Combat event known to the current program.
 */
type KnownCombatEvent = {
	[K in CombatEventType]: CombatEvent<K, CombatEventMap[K]>;
}[CombatEventType];

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

export {
	COMBAT_EVENT_TYPES,
	type CombatCompletedEvent,
	type CombatCompletedPayload,
	type CombatEvent,
	type CombatEventMap,
	CombatEvents,
	type CombatEventType,
	type CoreCombatEvent,
	type KnownCombatEvent,
};
