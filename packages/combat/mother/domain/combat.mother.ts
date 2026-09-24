import { faker } from '@faker-js/faker';
import type { CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat } from '@pocket-forge/combat/domain';
import { RandomPocketMother } from '@pocket-forge/rng/mother/domain';

import CombatantGroupMother from './combatant-group.mother';

export default class CombatMother {
	static create(overrides?: Partial<CombatPrimitives>): Combat {
		return Combat.fromPrimitives(this.primitives(overrides));
	}

	static primitives(overrides?: Partial<CombatPrimitives>): CombatPrimitives {
		const rng = RandomPocketMother.create();

		return {
			attributes: {},
			groups: [CombatantGroupMother.primitives()],
			id: faker.string.uuid(),
			randomPocket: rng.toPrimitives(),
			status: 'active' as const,
			...overrides,
		};
	}
}
