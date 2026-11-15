import { faker } from '@faker-js/faker';
import type { CombatantGroupPrimitives } from '@pocket-forge/combat/domain';
import { CombatantGroup } from '@pocket-forge/combat/domain';

import CombatantMother from './combatant.mother';

export default class CombatantGroupMother {
	static create(overrides?: Partial<CombatantGroupPrimitives>): CombatantGroup {
		return CombatantGroup.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CombatantGroupPrimitives>): CombatantGroupPrimitives {
		const id = overrides?.id ?? faker.string.uuid();

		return {
			attributes: {},
			combatants: [CombatantMother.primitives({ groupId: id })],
			id,
			name: faker.word.noun(),
			...overrides,
		};
	}
}
