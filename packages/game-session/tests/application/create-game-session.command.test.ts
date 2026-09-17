import Either from '@hexadrop/either';
import BunMockEventBus from '@hexadrop/event/bus/mock/bun';
import { describe, expect, it } from 'bun:test';

import MockGameSessionRepository from '../../mock/domain/game-session.repository';
import { CreateGameSessionCommandMother } from '../../mother/application';
import { CreateGameSessionCommandHandler } from '../../src/application';
import { GameSessionCreatedEvent } from '../../src/domain';

describe('CreateGameSessionCommandHandler', () => {
	it('persists the session and publishes created event', async () => {
		const repository = new MockGameSessionRepository();
		repository.upsert.mockResolvedValue(Either.right());
		const eventBus = new BunMockEventBus();
		const handler = new CreateGameSessionCommandHandler(repository, eventBus);
		const command = CreateGameSessionCommandMother.create();

		const result = await handler.run(command);

		expect(result.isRight()).toBe(true);

		eventBus.assertPublishedEvents(new GameSessionCreatedEvent(command.id));
	});

	it('returns left if repository upsert fails', async () => {
		const repository = new MockGameSessionRepository();
		repository.upsert.mockResolvedValue(Either.left());
		const eventBus = new BunMockEventBus();
		const handler = new CreateGameSessionCommandHandler(repository, eventBus);
		const command = CreateGameSessionCommandMother.create();

		const result = await handler.run(command);

		expect(result.isLeft()).toBe(true);
		eventBus.assertNotPublishEvent();
	});
});
