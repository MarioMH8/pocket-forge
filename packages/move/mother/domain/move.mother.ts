import { faker } from '@faker-js/faker';
import { AttributeAssignmentMother } from '@pocket-forge/attribute/mother/domain';
import type { MovePrimitives } from '@pocket-forge/move/domain';
import { Move } from '@pocket-forge/move/domain';

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
