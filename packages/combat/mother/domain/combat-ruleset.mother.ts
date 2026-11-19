import type { CombatGroupConstraints, CombatRulesetPrimitives } from '@pocket-forge/combat/domain';

/**
 * Composition constraints used by the test ruleset fixture.
 *
 * Concrete format packages declare their own constraints with the same shape.
 */
const TEST_GROUP_CONSTRAINTS: CombatGroupConstraints = {
	maxCombatantsPerGroup: 3,
	maxGroups: 3,
	minCombatantsPerGroup: 2,
	minGroups: 2,
};

export default class CombatRulesetMother {
	static primitives(overrides?: Partial<CombatRulesetPrimitives>): CombatRulesetPrimitives {
		return {
			attributes: {},
			groupConstraints: { ...TEST_GROUP_CONSTRAINTS },
			...overrides,
		};
	}
}

export { TEST_GROUP_CONSTRAINTS };
