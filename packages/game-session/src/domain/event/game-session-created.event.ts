import DomainEvent from '@hexadrop/event';

export default class GameSessionCreatedEvent extends DomainEvent {
	static override EVENT_NAME = 'GameSession.created';

	constructor(aggregateId: string) {
		super(GameSessionCreatedEvent.EVENT_NAME, aggregateId);
	}
}
