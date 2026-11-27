import DomainEvent from '@hexadrop/event';

/**
 * Domain event emitted when a new {@link GameSession} is created.
 *
 * Subscribers can listen for this event to initialise session-scoped resources
 * such as creature rosters, inventory, or world state.
 *
 * @example
 * ```ts
 * const event = new GameSessionCreatedEvent('01ARZ3NDEKTSV4RRFFQ69G5FAV');
 * console.log(event.eventName); // 'GameSession.created'
 * ```
 */
export default class GameSessionCreatedEvent extends DomainEvent {
	static override EVENT_NAME = 'GameSession.created';

	constructor(aggregateId: string) {
		super(GameSessionCreatedEvent.EVENT_NAME, aggregateId);
	}
}
