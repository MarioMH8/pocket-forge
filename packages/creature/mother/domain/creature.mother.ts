import { faker } from '@faker-js/faker';
import { AbilityMother } from '@pocket-forge/abilities/mother/domain';
import { AttributeAssignmentMother } from '@pocket-forge/attributes/mother/domain';
import type { CreaturePrimitives } from '@pocket-forge/creature/domain';
import { Creature } from '@pocket-forge/creature/domain';
import { MoveMother } from '@pocket-forge/moves/mother/domain';
import { SpeciesMother } from '@pocket-forge/species/mother/domain';

export default class CreatureMother {
	static create(overrides?: Partial<CreaturePrimitives>): Creature {
		return Creature.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CreaturePrimitives>): CreaturePrimitives {
		return {
			abilities: [AbilityMother.primitives()],
			attributes: {
				[AttributeAssignmentMother.DEFAULT_DEFINITION_ID]: AttributeAssignmentMother.DEFAULT_VALUE,
			},
			id: faker.string.uuid(),
			moves: [MoveMother.primitives()],
			name: faker.person.firstName(),
			species: SpeciesMother.primitives(),
			...overrides,
		};
	}
}
