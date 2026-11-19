import type { AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Ordered, serializable event emitted by a resolved Combat Transition.
 *
 * Events are transport data, not history: Combat does not store them. The
 * caller decides whether and where to persist or publish them.
 */
export default interface CombatEvent {
	/**
	 * Serializable event data.
	 */
	readonly payload: AttributeValues;
	/**
	 * Position of the event inside its transition, starting at one.
	 */
	readonly sequence: number;
	/**
	 * Stable event type identifier defined by the plugin.
	 */
	readonly type: string;
}
