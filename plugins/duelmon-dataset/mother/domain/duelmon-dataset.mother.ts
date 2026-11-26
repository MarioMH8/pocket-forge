import type { DuelmonDataset, DuelmonMove, DuelmonSpecies, DuelmonType } from '@pocket-forge/duelmon-dataset';
import { DuelmonTypes } from '@pocket-forge/duelmon-dataset';

type TypeChartOverrides = Readonly<Partial<Record<DuelmonType, Readonly<Partial<Record<DuelmonType, number>>>>>>;

/**
 * Showdown damage-taken codes for the Gen 1 chart: 0 neutral, 1 weak,
 * 2 resisted, 3 immune.
 */
const TYPE_CHART_OVERRIDES: TypeChartOverrides = {
	Bug: { Fighting: 2, Fire: 1, Flying: 1, Grass: 2, Ground: 2, Poison: 1, Rock: 1 },
	Dragon: { Dragon: 1, Electric: 2, Fire: 2, Grass: 2, Ice: 1, Water: 2 },
	Electric: { Electric: 2, Flying: 2, Ground: 1 },
	Fighting: { Bug: 2, Flying: 1, Psychic: 1, Rock: 2 },
	Fire: { Bug: 2, Fire: 2, Grass: 2, Ground: 1, Rock: 1, Water: 1 },
	Flying: { Bug: 2, Electric: 1, Fighting: 2, Grass: 2, Ground: 3, Ice: 1, Rock: 1 },
	Ghost: { Bug: 2, Fighting: 3, Ghost: 1, Normal: 3, Poison: 2 },
	Grass: {
		Bug: 1,
		Electric: 2,
		Fire: 1,
		Flying: 1,
		Grass: 2,
		Ground: 2,
		Ice: 1,
		Poison: 1,
		Water: 2,
	},
	Ground: { Electric: 3, Grass: 1, Ice: 1, Poison: 2, Rock: 2, Water: 1 },
	Ice: { Fighting: 1, Fire: 1, Ice: 2, Rock: 1 },
	Normal: { Fighting: 1, Ghost: 3 },
	Poison: { Bug: 1, Fighting: 2, Grass: 2, Ground: 1, Poison: 2, Psychic: 1 },
	Psychic: { Bug: 1, Fighting: 2, Ghost: 3, Psychic: 2 },
	Rock: {
		Fighting: 1,
		Fire: 2,
		Flying: 2,
		Grass: 1,
		Ground: 1,
		Normal: 2,
		Poison: 2,
		Water: 1,
	},
	Water: { Electric: 1, Fire: 2, Grass: 1, Ice: 2, Water: 2 },
};

/**
 * Object Mother for the original Duelmon dataset fixture.
 *
 * The dataset is deterministic: tests depend on species, moves, and type
 * relations by name. The type chart is always complete for all fifteen
 * defender types and all fifteen attack types, so catalog validation passes.
 */
export default class DuelmonDatasetMother {
	private static readonly MOVES: readonly DuelmonMove[] = [
		{
			accuracy: true,
			category: 'Special',
			flags: {},
			id: 'ember-burst',
			name: 'Ember Burst',
			power: 40,
			pp: 25,
			priority: 0,
			target: 'normal',
			type: 'Fire',
		},
		{
			accuracy: 90,
			category: 'Special',
			flags: {},
			id: 'ember-spark',
			name: 'Ember Spark',
			power: 40,
			pp: 25,
			priority: 0,
			target: 'normal',
			type: 'Fire',
		},
		{
			accuracy: true,
			category: 'Special',
			flags: {},
			id: 'aqua-burst',
			name: 'Aqua Burst',
			power: 40,
			pp: 25,
			priority: 0,
			target: 'normal',
			type: 'Water',
		},
		{
			accuracy: true,
			category: 'Physical',
			flags: {},
			id: 'leaf-lash',
			name: 'Leaf Lash',
			power: 45,
			pp: 25,
			priority: 0,
			target: 'normal',
			type: 'Grass',
		},
		{
			accuracy: true,
			category: 'Special',
			flags: {},
			id: 'flare',
			name: 'Flare',
			power: 40,
			pp: 25,
			priority: 0,
			secondary: { chance: 10, status: 'burn' },
			target: 'normal',
			type: 'Fire',
		},
		{
			accuracy: true,
			category: 'Physical',
			flags: {},
			id: 'tackle',
			name: 'Tackle',
			power: 35,
			pp: 35,
			priority: 0,
			target: 'normal',
			type: 'Normal',
		},
		{
			accuracy: true,
			category: 'Physical',
			flags: {},
			id: 'quick-jab',
			name: 'Quick Jab',
			power: 40,
			pp: 30,
			priority: 1,
			target: 'normal',
			type: 'Normal',
		},
		{
			accuracy: true,
			category: 'Status',
			flags: {},
			id: 'oath',
			name: 'Oath',
			power: 0,
			pp: 30,
			priority: 0,
			target: 'self',
			type: 'Normal',
		},
		{
			accuracy: 1,
			category: 'Physical',
			flags: {},
			id: 'gamble',
			name: 'Gamble',
			power: 20,
			pp: 5,
			priority: 0,
			target: 'normal',
			type: 'Normal',
		},
		{
			accuracy: 100,
			category: 'Special',
			flags: {},
			id: 'shade',
			name: 'Shade',
			power: 45,
			pp: 15,
			priority: 0,
			target: 'normal',
			type: 'Ghost',
		},
		{
			accuracy: 100,
			category: 'Physical',
			flags: {},
			id: 'low-sweep',
			name: 'Low Sweep',
			power: 0,
			pp: 20,
			priority: 0,
			target: 'normal',
			type: 'Fighting',
		},
	];

	private static readonly SPECIES: readonly DuelmonSpecies[] = [
		{
			baseStats: this.baseStats({ atk: 52, def: 43, hp: 39, spa: 60, spe: 65 }),
			id: 'emberling',
			name: 'Emberling',
			num: 1,
			types: ['Fire'],
		},
		{
			baseStats: this.baseStats({ atk: 48, def: 65, hp: 44, spa: 50, spe: 43 }),
			id: 'aquafin',
			name: 'Aquafin',
			num: 2,
			types: ['Water'],
		},
		{
			baseStats: this.baseStats(),
			id: 'mudfin',
			name: 'Mudfin',
			num: 3,
			types: ['Water', 'Grass'],
		},
		{
			baseStats: this.baseStats({ atk: 80, def: 120, hp: 60 }),
			id: 'stonelet',
			name: 'Stonelet',
			num: 4,
			types: ['Rock', 'Ground'],
		},
		{
			baseStats: this.baseStats({ spa: 70 }),
			id: 'wisp',
			name: 'Wisp',
			num: 5,
			types: ['Ghost'],
		},
		{
			baseStats: this.baseStats({ spa: 65 }),
			id: 'sprout',
			name: 'Sprout',
			num: 6,
			types: ['Grass'],
		},
		{
			baseStats: this.baseStats({ spa: 75 }),
			id: 'volt',
			name: 'Volt',
			num: 7,
			types: ['Electric'],
		},
	];

	/**
	 * Builds the complete dataset.
	 *
	 * @param overrides - Dataset fields to replace.
	 * @returns The dataset fixture.
	 */
	static create(overrides: Partial<DuelmonDataset> = {}): DuelmonDataset {
		return {
			abilities: [],
			generation: 1,
			moves: this.MOVES,
			source: { commit: 'fixture-commit', repository: 'smogon/pokemon-showdown' },
			species: this.SPECIES,
			typechart: this.typechart(),
			...overrides,
		};
	}

	/**
	 * Returns a fresh copy of the dataset moves.
	 *
	 * @returns The fixture moves.
	 */
	static moves(): readonly DuelmonMove[] {
		return this.MOVES.map(move => ({ ...move }));
	}

	/**
	 * Returns a fresh copy of the dataset species.
	 *
	 * @returns The fixture species.
	 */
	static species(): readonly DuelmonSpecies[] {
		return this.SPECIES.map(species => ({
			...species,
			baseStats: { ...species.baseStats },
			types: [...species.types],
		}));
	}

	/**
	 * Complete Showdown-coded Gen 1 type chart.
	 *
	 * @param overrides - Damage-taken codes to replace.
	 * @returns A chart with every defender and attack relation.
	 */
	static typechart(overrides: TypeChartOverrides = TYPE_CHART_OVERRIDES): DuelmonDataset['typechart'] {
		return Object.fromEntries(
			DuelmonTypes.ALL.map(defender => [
				defender,
				Object.fromEntries(DuelmonTypes.ALL.map(attack => [attack, overrides[defender]?.[attack] ?? 0])),
			])
		);
	}

	/**
	 * Builds a base stat block with neutral values and the requested overrides.
	 *
	 * @param overrides - Base stats to replace.
	 * @returns The base stat block.
	 */
	private static baseStats(overrides: Partial<DuelmonSpecies['baseStats']> = {}): DuelmonSpecies['baseStats'] {
		return { atk: 50, def: 50, hp: 50, spa: 50, spd: 50, spe: 50, ...overrides };
	}
}
