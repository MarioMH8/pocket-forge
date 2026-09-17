import Either from '@hexadrop/either';
import BunMockEventBus from '@hexadrop/event/bus/mock/bun';
import { describe, expect, it } from 'bun:test';

import MockGameSessionRepository from '../../mock/domain/game-session.repository';
import { DeleteGameSessionCommandMother } from '../../mother/application';
import GameSessionMother from '../../mother/domain/game-session.mother';
import { DeleteGameSessionCommandHandler } from '../../src/application';
import { GameSessionDeletedEvent } from '../../src/domain';

describe('DeleteGameSessionCommandHandler', () => {
	it('deletes the session and publishes deleted event', async () => {
		const session = GameSessionMother.fromPrimitives();
		const repository = new MockGameSessionRepository();
		repository.findById.mockResolvedValue(Either.right(session));
		repository.remove.mockResolvedValue(Either.right());
		const eventBus = new BunMockEventBus();
		const handler = new DeleteGameSessionCommandHandler(repository, eventBus);

		const command = DeleteGameSessionCommandMother.create({ id: session.id.value });
		const result = await handler.run(command);

		expect(result.isRight()).toBe(true);

		eventBus.assertPublishedEvents(new GameSessionDeletedEvent(session.id.value));
	});

	it('returns left if session is not found', async () => {
		const repository = new MockGameSessionRepository();
		repository.findById.mockResolvedValue(Either.left());
		const eventBus = new BunMockEventBus();
		const handler = new DeleteGameSessionCommandHandler(repository, eventBus);

		const command = DeleteGameSessionCommandMother.create();
		const result = await handler.run(command);

		expect(result.isLeft()).toBe(true);
		eventBus.assertNotPublishEvent();
	});
});
