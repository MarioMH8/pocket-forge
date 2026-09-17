import { faker } from '@faker-js/faker';
import { AttributeAssignmentMother } from '@pocket-forge/attributes/mother/domain';
import type { MovePrimitives } from '@pocket-forge/moves/domain';
import { Move } from '@pocket-forge/moves/domain';

export default class MoveMother {
	static create(overrides?: Partial<MovePrimitives>): Move {
		return Move.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<MovePrimitives>): MovePrimitives {
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
