import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type {
	Combat,
	CombatActionSet,
	CombatPrimitives,
	CombatRuleset,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import SemverContractVersionValidator from '@pocket-forge/combat/infrastructure';
import { CombatantGroupMother, CombatantMother, CombatRulesetMother } from '@pocket-forge/combat/mother/domain';
import {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	MODIFY_ATTRIBUTE_ACTION_ID,
	OneVersusOneCombatRuleset,
	ReferenceCombatActionSet,
	ReferenceCombatPlugin,
} from '@pocket-forge/combat-reference/domain';

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
const VERSION_VALIDATOR = new SemverContractVersionValidator();

const COMPLETION_ATTRIBUTE_DEFINITIONS: readonly AttributeDefinition[] = [
	...ATTRIBUTE_DEFINITIONS,
	...COMPLETION_CONFIG_DEFINITIONS,
];

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
				name: 'Alpha',
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
				name: 'Beta',
			}),
		],
		id: 'combat-1',
		randomPocket: { seed: 42, state: 42 },
		status: 'active',
		...overrides,
	};
}

function referenceCombat(overrides?: Partial<CombatPrimitives>, powers?: PowerOverrides): Combat {
	return CombatEntity.fromPrimitives(combatPrimitives(overrides, powers));
}

function referencePlugin(versionValidator: ContractVersionValidator = VERSION_VALIDATOR): ReferenceCombatPlugin {
	return new ReferenceCombatPlugin(versionValidator, ATTRIBUTE_DEFINITIONS);
}

function referenceActionSet(config: AttributeValues, moveId = 'move-1'): CombatActionSet {
	return ReferenceCombatActionSet.create(
		[{ actionId: MODIFY_ATTRIBUTE_ACTION_ID, config, moveId }],
		referencePlugin().actions,
		VERSION_VALIDATOR
	).getRight();
}

function completionRuleset(attributes: AttributeValues = DEFAULT_COMPLETION_ATTRIBUTES): CombatRuleset {
	return OneVersusOneCombatRuleset.create(
		CombatRulesetMother.primitives({
			attributes: { ...attributes },
			contractVersion: OneVersusOneCombatRuleset.VERSION,
			groupConstraints: { ...OneVersusOneCombatRuleset.CONSTRAINTS },
			id: 'reference-completion',
			kind: OneVersusOneCombatRuleset.KIND,
			name: 'Reference Completion',
		}),
		[...COMPLETION_ATTRIBUTE_DEFINITIONS],
		VERSION_VALIDATOR
	).getRight();
}

export {
	ATTRIBUTE_DEFINITIONS,
	COMPLETION_ATTRIBUTE_DEFINITIONS,
	completionRuleset,
	DEFAULT_COMPLETION_ATTRIBUTES,
	referenceActionSet,
	referenceCombat,
	referencePlugin,
	VERSION_VALIDATOR,
};
