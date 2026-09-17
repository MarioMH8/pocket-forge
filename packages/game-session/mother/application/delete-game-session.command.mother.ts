import { faker } from '@faker-js/faker';

import { DeleteGameSessionCommand } from '../../src/application';

export default class DeleteGameSessionCommandMother {
	static create(overrides?: { id?: string }): DeleteGameSessionCommand {
		return new DeleteGameSessionCommand({
			id: overrides?.id ?? faker.string.ulid(),
		});
	}
}
