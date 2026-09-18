import DomainEvent from '@hexadrop/event';

/**
 * Domain event emitted when a {@link GameSession} is marked for deletion.
 *
 * Subscribers can listen for this event to clean up session-scoped resources
 * (creatures, inventory, etc.) before the session is permanently removed.
 *
 * @example
 * ```ts
 * const event = new GameSessionDeletedEvent('01ARZ3NDEKTSV4RRFFQ69G5FAV');
 * console.log(event.eventName); // 'GameSession.deleted'
 * ```
 */
export default class GameSessionDeletedEvent extends DomainEvent {
	static override EVENT_NAME = 'GameSession.deleted';

	constructor(aggregateId: string) {
		super(GameSessionDeletedEvent.EVENT_NAME, aggregateId);
	}
}
