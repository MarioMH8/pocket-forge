import { faker } from '@faker-js/faker';

import { GetGameSessionQuery } from '../../src/application';

export default class GetGameSessionQueryMother {
	static create(overrides?: { id?: string }): GetGameSessionQuery {
		return new GetGameSessionQuery({
			id: overrides?.id ?? faker.string.ulid(),
		});
	}
}
