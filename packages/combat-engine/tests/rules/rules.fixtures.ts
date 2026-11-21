import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import { CombatRuleMother } from '@pocket-forge/combat-engine/mother/domain';
import type { CombatCompositionRulePrimitives, ThresholdCombatCompletionRule } from '@pocket-forge/combat-engine/rules';
import {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	OneVersusOneCombatRule,
	ThresholdCombatCompletionRule as ThresholdRule,
} from '@pocket-forge/combat-engine/rules';

const POWER = AttributeDefinitionMother.number({
	constraints: { max: 100, min: 0 },
	defaultValue: 10,
	key: 'power',
});

const BANNER = AttributeDefinitionMother.string({
	constraints: { maxLength: 20, minLength: 1 },
	defaultValue: 'red',
	key: 'banner',
});

const ATTRIBUTE_DEFINITIONS: readonly AttributeDefinition[] = [POWER, BANNER];

const DEFAULT_COMPLETION_ATTRIBUTES: AttributeValues = {
	[COMPLETION_CONFIG_KEYS.attributeKey]: 'power',
	[COMPLETION_CONFIG_KEYS.comparison]: 'lte',
	[COMPLETION_CONFIG_KEYS.threshold]: 10,
	[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'threshold-group',
};

interface PowerOverrides {
	readonly combat?: number;
	readonly combatant?: number;
	readonly group?: number;
}

function combatPrimitives(overrides?: Partial<CombatPrimitives>, powers?: PowerOverrides): CombatPrimitives {
	return {
		attributes: { power: powers?.combat ?? 50 },
		groups: [
			CombatantGroupMother.primitives({
				attributes: { banner: 'red', power: powers?.group ?? 40 },
				combatants: [
					CombatantMother.primitives({
						attributes: { banner: 'red', power: powers?.combatant ?? 30 },
						groupId: 'group-a',
						id: 'combatant-a',
					}),
				],
				id: 'group-a',
			}),
			CombatantGroupMother.primitives({
				attributes: { banner: 'blue', power: 60 },
				combatants: [
					CombatantMother.primitives({
						attributes: { banner: 'blue', power: 70 },
						groupId: 'group-b',
						id: 'combatant-b',
					}),
				],
				id: 'group-b',
			}),
		],
		id: 'combat-1',
		randomPocket: { seed: 42, state: 42 },
		status: 'active',
		...overrides,
	};
}

function builtInCombat(overrides?: Partial<CombatPrimitives>, powers?: PowerOverrides): Combat {
	return CombatEntity.fromPrimitives(combatPrimitives(overrides, powers));
}

function compositionRule(overrides?: Partial<CombatCompositionRulePrimitives>): OneVersusOneCombatRule {
	return OneVersusOneCombatRule.create(
		CombatRuleMother.primitives({
			groupConstraints: { ...OneVersusOneCombatRule.CONSTRAINTS },
			...overrides,
		}),
		ATTRIBUTE_DEFINITIONS
	).getRight();
}

function completionRule(attributes: AttributeValues = DEFAULT_COMPLETION_ATTRIBUTES): ThresholdCombatCompletionRule {
	return ThresholdRule.create(
		{ attributes: { ...attributes } },
		COMPLETION_CONFIG_DEFINITIONS,
		ATTRIBUTE_DEFINITIONS
	).getRight();
}

export { ATTRIBUTE_DEFINITIONS, builtInCombat, completionRule, compositionRule, DEFAULT_COMPLETION_ATTRIBUTES };
