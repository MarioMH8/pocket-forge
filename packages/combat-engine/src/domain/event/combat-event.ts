import type { AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Ordered, serializable event emitted by a resolved Combat Transition.
 *
 * @typeParam TType - Stable event type identifier.
 * @typeParam TPayload - Serializable event data. Defaults to plain attribute values.
 */
export interface CombatEvent<TType extends string = string, TPayload extends AttributeValues = AttributeValues> {
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
