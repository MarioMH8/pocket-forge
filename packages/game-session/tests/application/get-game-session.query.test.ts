import Either from '@hexadrop/either';
import { describe, expect, it } from 'bun:test';

import MockGameSessionRepository from '../../mock/domain/game-session.repository';
import { GetGameSessionQueryMother } from '../../mother/application';
import GameSessionMother from '../../mother/domain/game-session.mother';
import { GetGameSessionQueryHandler } from '../../src/application';

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
