import { faker } from '@faker-js/faker';
import { GameSession } from '@pocket-forge/game-session/domain';

export default class GameSessionMother {
	static create(overrides?: { id?: string }): GameSession {
		return GameSession.create({
			id: overrides?.id ?? faker.string.ulid(),
		});
	}

	static fromPrimitives(overrides?: { id?: string }): GameSession {
		return GameSession.fromPrimitives({
			id: overrides?.id ?? faker.string.ulid(),
		});
	}
}
