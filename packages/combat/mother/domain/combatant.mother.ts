import { faker } from '@faker-js/faker';
import type { CombatantPrimitives } from '@pocket-forge/combat/domain';
import { Combatant } from '@pocket-forge/combat/domain';
import { CreatureMother } from '@pocket-forge/creature/mother/domain';

export default class CombatantMother {
	static create(overrides?: Partial<CombatantPrimitives>): Combatant {
		return Combatant.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CombatantPrimitives>): CombatantPrimitives {
		return {
			attributes: {},
			creature: CreatureMother.primitives(),
			groupId: faker.string.uuid(),
			id: faker.string.uuid(),
			...overrides,
		};
	}
}
