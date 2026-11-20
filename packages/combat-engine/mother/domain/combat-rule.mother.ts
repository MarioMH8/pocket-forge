import type { CombatCompositionRulePrimitives } from '@pocket-forge/combat-engine/rules';

const TEST_GROUP_CONSTRAINTS = {
	maxCombatantsPerGroup: 3,
	maxGroups: 3,
	minCombatantsPerGroup: 2,
	minGroups: 2,
} as const;

/**
 * Object Mother for combat rule primitives.
 */
export default class CombatRuleMother {
	static primitives(overrides?: Partial<CombatCompositionRulePrimitives>): CombatCompositionRulePrimitives {
		return {
			attributes: {},
			groupConstraints: { ...TEST_GROUP_CONSTRAINTS },
			...overrides,
		};
	}
}

export { TEST_GROUP_CONSTRAINTS };
