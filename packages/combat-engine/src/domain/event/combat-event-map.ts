import type { CombatCompletedEvent, CombatCompletedPayload } from './combat-completed.event';
import type { CombatEvent } from './combat-event';

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
 * Events emitted by the Combat Engine itself.
 */
type CoreCombatEvent = CombatCompletedEvent;

/**
 * Discriminated union of every Combat event known to the current program.
 */
type KnownCombatEvent = {
	[K in CombatEventType]: CombatEvent<K, CombatEventMap[K]>;
}[CombatEventType];

export type { CombatEventMap, CombatEventType, CoreCombatEvent, KnownCombatEvent };
