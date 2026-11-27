import Either from '@hexadrop/either';
import BunMockEventBus from '@hexadrop/event/bus/mock/bun';
import { CreateGameSessionCommandHandler } from '@pocket-forge/game-session/application';
import { GameSessionCreatedEvent } from '@pocket-forge/game-session/domain';
import { MockGameSessionRepository } from '@pocket-forge/game-session/mock/domain';
import { CreateGameSessionCommandMother } from '@pocket-forge/game-session/mother/application';
import { describe, expect, it } from 'bun:test';

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
