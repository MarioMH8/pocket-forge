import { faker } from '@faker-js/faker';
import type { AbilityPrimitives } from '@pocket-forge/ability/domain';
import { Ability } from '@pocket-forge/ability/domain';

export default class AbilityMother {
	static create(overrides?: Partial<AbilityPrimitives>): Ability {
		return Ability.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<AbilityPrimitives>): AbilityPrimitives {
		return {
			attributes: {},
			description: faker.lorem.sentence(),
			id: faker.string.uuid(),
			name: faker.word.words(2),
			...overrides,
		};
	}
}
