import { faker } from '@faker-js/faker';
import type { CombatantGroupPrimitives } from '@pocket-forge/combat/domain';
import { CombatantGroup } from '@pocket-forge/combat/domain';

import CombatantMother from './combatant.mother';

export default class CombatantGroupMother {
	static create(overrides?: Partial<CombatantGroupPrimitives>): CombatantGroup {
		return CombatantGroup.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CombatantGroupPrimitives>): CombatantGroupPrimitives {
		return {
			attributes: {},
			combatants: [CombatantMother.primitives()],
			id: faker.string.uuid(),
			name: faker.word.noun(),
			...overrides,
		};
	}
}
