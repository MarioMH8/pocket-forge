import DomainEvent from '@hexadrop/event';

export default class GameSessionDeletedEvent extends DomainEvent {
	static override EVENT_NAME = 'GameSession.deleted';

	constructor(aggregateId: string) {
		super(GameSessionDeletedEvent.EVENT_NAME, aggregateId);
	}
}
