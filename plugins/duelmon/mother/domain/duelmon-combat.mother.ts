import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { Combat, CombatantPrimitives, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import type {
	CombatActionBindingPrimitives,
	CombatActionBindingSet,
	CombatRule,
} from '@pocket-forge/combat-engine/domain';
import { CombatActionBindingSet as CombatActionBindingSetEntity } from '@pocket-forge/combat-engine/domain';
import { CombatRuleMother } from '@pocket-forge/combat-engine/mother/domain';
import {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	OneVersusOneCombatRule,
	ThresholdCombatCompletionRule,
} from '@pocket-forge/combat-engine/rules';
import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import {
	DuelmonCombatPlugin,
	Gen1BattleStats,
	Gen1UseMoveMechanics,
	ModifyAttributeAction,
	ModifyAttributeConfig,
	UseMoveAction,
} from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';

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
const PLUGIN_ATTRIBUTE_DEFINITIONS: readonly AttributeDefinition[] = [
	...ATTRIBUTE_DEFINITIONS,
	...Gen1BattleStats.DEFINITIONS,
];
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

const DUELMON_BINDINGS: readonly CombatActionBindingPrimitives[] = [
	{
		actionId: ModifyAttributeAction.ID,
		config: {
			[ModifyAttributeConfig.KEYS.amount]: 5,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'add',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		},
		moveId: 'move-1',
	},
	{
		actionId: ModifyAttributeAction.ID,
		config: {
			[ModifyAttributeConfig.KEYS.amount]: 25,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'set',
			[ModifyAttributeConfig.KEYS.probability]: 0.5,
			[ModifyAttributeConfig.KEYS.scope]: 'group',
		},
		moveId: 'move-2',
	},
];

interface PowerOverrides {
	readonly combat?: number;
	readonly combatant?: number;
	readonly group?: number;
}

interface UseMoveCombatOptions {
	readonly attackerActive?: boolean;
	readonly attackerMoves?: readonly string[];
	readonly targetActive?: boolean;
}

const USE_MOVE_ATTACKER_MOVES: readonly string[] = ['ember-burst', 'tackle', 'gamble', 'low-sweep'];

/**
 * Object Mother for Duelmon combats, actions, and the composed plugin.
 */
export default class DuelmonCombatMother {
	/**
	 * Project attribute definitions used by `modifyAttribute` tests.
	 */
	static readonly ATTRIBUTE_DEFINITIONS = ATTRIBUTE_DEFINITIONS;
	/**
	 * Completion definitions for the threshold ruleset.
	 */
	static readonly COMPLETION_ATTRIBUTE_DEFINITIONS = COMPLETION_ATTRIBUTE_DEFINITIONS;
	/**
	 * Default completion configuration.
	 */
	static readonly DEFAULT_COMPLETION_ATTRIBUTES = DEFAULT_COMPLETION_ATTRIBUTES;
	/**
	 * Definitions available to the composed plugin, including Gen 1 stats.
	 */
	static readonly PLUGIN_ATTRIBUTE_DEFINITIONS = PLUGIN_ATTRIBUTE_DEFINITIONS;

	private static catalogCache: DuelmonCatalog | undefined;

	/**
	 * Builds an action binding set containing one modifyAttribute binding.
	 *
	 * @param config - Binding configuration values.
	 * @param moveId - Bound move identifier.
	 * @returns The validated action binding set.
	 */
	static actionBindings(config: AttributeValues, moveId = 'move-1'): CombatActionBindingSet {
		return CombatActionBindingSetEntity.create(
			{ bindings: [{ actionId: ModifyAttributeAction.ID, config, moveId }] },
			this.plugin().actions
		).getRight();
	}

	/**
	 * Builds the authored modifyAttribute bindings.
	 *
	 * @returns Fresh binding primitives.
	 */
	static bindings(): CombatActionBindingPrimitives[] {
		return DUELMON_BINDINGS.map(binding => ({ ...binding, config: { ...binding.config } }));
	}

	/**
	 * Returns the catalog built from the dataset fixture.
	 *
	 * @returns The validated Duelmon catalog.
	 */
	static catalog(): DuelmonCatalog {
		this.catalogCache ??= DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();

		return this.catalogCache;
	}

	/**
	 * Builds one combatant primitive with a species and battle stats.
	 *
	 * @param id - Combatant identifier.
	 * @param groupId - Owning group identifier.
	 * @param speciesId - Species identifier from the dataset fixture.
	 * @param attributes - Battle attributes.
	 * @param moveIds - Loadout move identifiers from the dataset fixture.
	 * @returns Combatant primitives.
	 */
	static combatant(
		id: string,
		groupId: string,
		speciesId: string,
		attributes: AttributeValues,
		moveIds: readonly string[] = []
	): CombatantPrimitives {
		return CombatantMother.primitives({
			attributes,
			creature: this.creature(speciesId, moveIds),
			groupId,
			id,
		});
	}

	/**
	 * Builds the threshold completion rule.
	 *
	 * @param attributes - Completion configuration attributes.
	 * @returns The completion rule.
	 */
	static completionRule(attributes: AttributeValues = DEFAULT_COMPLETION_ATTRIBUTES): CombatRule {
		return ThresholdCombatCompletionRule.create(
			{ attributes: { ...attributes } },
			[...COMPLETION_CONFIG_DEFINITIONS],
			[...ATTRIBUTE_DEFINITIONS]
		).getRight();
	}

	/**
	 * Builds the `1v1` composition rule.
	 *
	 * @returns The composition rule.
	 */
	static compositionRule(): CombatRule {
		return OneVersusOneCombatRule.create(
			CombatRuleMother.primitives({
				groupConstraints: { ...OneVersusOneCombatRule.CONSTRAINTS },
			}),
			[...ATTRIBUTE_DEFINITIONS]
		).getRight();
	}

	/**
	 * Builds a modifyAttribute combat snapshot.
	 *
	 * @param overrides - Combat primitive fields to replace.
	 * @param powers - Power values per scope.
	 * @returns The combat snapshot.
	 */
	static create(overrides: Partial<CombatPrimitives> = {}, powers: PowerOverrides = {}): Combat {
		return CombatEntity.fromPrimitives(this.primitives(overrides, powers));
	}

	/**
	 * Builds the creature snapshot referenced by a combatant.
	 *
	 * @param speciesId - Species identifier from the dataset fixture.
	 * @param moveIds - Loadout move identifiers from the dataset fixture.
	 * @returns Creature primitives.
	 */
	static creature(speciesId: string, moveIds: readonly string[] = []): CombatantPrimitives['creature'] {
		const catalog = this.catalog();

		return {
			abilities: [],
			attributes: {},
			id: `${speciesId}-creature`,
			moves: moveIds.map(moveId => {
				const move = catalog.findMove(moveId);

				if (!move) {
					throw new Error(`Missing fixture move "${moveId}"`);
				}

				return move.toPrimitives();
			}),
			species: { attributes: {}, id: speciesId },
		};
	}

	/**
	 * Builds the composed Duelmon plugin with explicit Gen 1 mechanics.
	 *
	 * @returns The plugin under test.
	 */
	static plugin(): DuelmonCombatPlugin {
		return new DuelmonCombatPlugin(PLUGIN_ATTRIBUTE_DEFINITIONS, this.catalog(), new Gen1UseMoveMechanics());
	}

	/**
	 * Builds combat primitives with power values at each scope.
	 *
	 * @param overrides - Combat primitive fields to replace.
	 * @param powers - Power values per scope.
	 * @returns Combat primitives.
	 */
	static primitives(overrides: Partial<CombatPrimitives> = {}, powers: PowerOverrides = {}): CombatPrimitives {
		return {
			attributes: { power: powers.combat ?? 50 },
			groups: [
				CombatantGroupMother.primitives({
					attributes: { banner: 'red', power: powers.group ?? 40 },
					combatants: [
						CombatantMother.primitives({
							attributes: { banner: 'red', power: powers.combatant ?? 30 },
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

	/**
	 * Builds an action binding set that binds every move to `useMove`.
	 *
	 * @param moveIds - Move identifiers to bind.
	 * @returns The validated action binding set.
	 */
	static useMoveBindings(moveIds: readonly string[] = ['ember-burst']): CombatActionBindingSet {
		return CombatActionBindingSetEntity.create(
			{
				bindings: moveIds.map(moveId => ({
					actionId: UseMoveAction.ID,
					config: {},
					moveId,
				})),
			},
			this.plugin().actions
		).getRight();
	}

	/**
	 * Builds the attacker and target combat used by `useMove` tests.
	 *
	 * @param overrides - Combat primitive fields to replace.
	 * @param options - Attacker loadout and active subsets for both groups.
	 * @returns The combat snapshot.
	 */
	static useMoveCombat(overrides: Partial<CombatPrimitives> = {}, options: UseMoveCombatOptions = {}): Combat {
		return CombatEntity.fromPrimitives({
			attributes: {},
			groups: [
				CombatantGroupMother.primitives({
					attributes: { activeCombatantIds: options.attackerActive === false ? [] : ['combatant-a'] },
					combatants: [
						this.combatant(
							'combatant-a',
							'group-a',
							'emberling',
							{
								attack: 100,
								defense: 80,
								hp: 100,
								level: 50,
								maxHp: 100,
								special: 120,
								speed: 50,
							},
							options.attackerMoves ?? USE_MOVE_ATTACKER_MOVES
						),
					],
					id: 'group-a',
				}),
				CombatantGroupMother.primitives({
					attributes: { activeCombatantIds: options.targetActive === false ? [] : ['combatant-b'] },
					combatants: [
						this.combatant('combatant-b', 'group-b', 'sprout', {
							attack: 90,
							defense: 100,
							hp: 100,
							level: 50,
							maxHp: 100,
							special: 90,
							speed: 50,
						}),
					],
					id: 'group-b',
				}),
			],
			id: 'combat-1',
			randomPocket: { seed: 42, state: 42 },
			status: 'active',
			...overrides,
		});
	}
}
