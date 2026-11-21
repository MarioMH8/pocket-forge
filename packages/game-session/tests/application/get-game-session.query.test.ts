import Either from '@hexadrop/either';
import { GetGameSessionQueryHandler } from '@pocket-forge/game-session/application';
import { MockGameSessionRepository } from '@pocket-forge/game-session/mock/domain';
import { GetGameSessionQueryMother } from '@pocket-forge/game-session/mother/application';
import { GameSessionMother } from '@pocket-forge/game-session/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('GetGameSessionQueryHandler', () => {
	it('returns the session when found', async () => {
		const session = GameSessionMother.fromPrimitives();
		const repository = new MockGameSessionRepository();
		repository.findById.mockResolvedValue(Either.right(session));
		const handler = new GetGameSessionQueryHandler(repository);

		const query = GetGameSessionQueryMother.create({ id: session.id.value });
		const result = await handler.run(query);

		expect(result.isRight()).toBe(true);
		expect(result.getRight().id.value).toBe(session.id.value);
	});

	it('returns left when session is not found', async () => {
		const repository = new MockGameSessionRepository();
		repository.findById.mockResolvedValue(Either.left());
		const handler = new GetGameSessionQueryHandler(repository);

		const query = GetGameSessionQueryMother.create();
		const result = await handler.run(query);

		expect(result.isLeft()).toBe(true);
	});
});
