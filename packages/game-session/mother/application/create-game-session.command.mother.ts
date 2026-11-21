import { faker } from '@faker-js/faker';
import { CreateGameSessionCommand } from '@pocket-forge/game-session/application';

export default class CreateGameSessionCommandMother {
	static create(overrides?: { id?: string }): CreateGameSessionCommand {
		return new CreateGameSessionCommand({
			id: overrides?.id ?? faker.string.ulid(),
		});
	}
}
