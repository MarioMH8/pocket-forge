import { faker } from '@faker-js/faker';
import { AbilityMother } from '@pocket-forge/ability/mother/domain';
import type { CreaturePrimitives } from '@pocket-forge/creature/domain';
import { Creature } from '@pocket-forge/creature/domain';
import { MoveMother } from '@pocket-forge/move/mother/domain';
import { SpeciesMother } from '@pocket-forge/species/mother/domain';

export default class CreatureMother {
	static create(overrides?: Partial<CreaturePrimitives>): Creature {
		return Creature.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CreaturePrimitives>): CreaturePrimitives {
		return {
			abilities: [AbilityMother.primitives()],
			attributes: {},
			id: faker.string.uuid(),
			moves: [MoveMother.primitives()],
			species: SpeciesMother.primitives(),
			...overrides,
		};
	}
}
