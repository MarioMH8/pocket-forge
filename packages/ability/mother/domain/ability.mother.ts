import { faker } from '@faker-js/faker';
import type { AbilityPrimitives } from '@pocket-forge/ability/domain';
import { Ability } from '@pocket-forge/ability/domain';
import { AttributeAssignmentMother } from '@pocket-forge/attribute/mother/domain';

export default class AbilityMother {
	static create(overrides?: Partial<AbilityPrimitives>): Ability {
		return Ability.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<AbilityPrimitives>): AbilityPrimitives {
		return {
			attributes: {
				[AttributeAssignmentMother.DEFAULT_DEFINITION_ID]: AttributeAssignmentMother.DEFAULT_VALUE,
			},
			description: faker.lorem.sentence(),
			id: faker.string.uuid(),
			name: faker.word.words(2),
			...overrides,
		};
	}
}
