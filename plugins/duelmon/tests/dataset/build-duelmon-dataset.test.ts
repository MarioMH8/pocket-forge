import type { DuelmonSpecies, ShowdownTables } from '@pocket-forge/duelmon/dataset';
import { buildDuelmonDataset } from '@pocket-forge/duelmon/dataset';
import { describe, expect, it } from 'bun:test';

const GEN1_ATTACK_TYPES = [
	'Normal',
	'Fire',
	'Water',
	'Electric',
	'Grass',
	'Ice',
	'Fighting',
	'Poison',
	'Ground',
	'Flying',
	'Psychic',
	'Bug',
	'Rock',
	'Ghost',
	'Dragon',
] as const;

const EXCLUDED_ATTACK_TYPES = ['Dark', 'Steel', 'Fairy', 'Stellar'] as const;

function stats(overrides: Partial<DuelmonSpecies['baseStats']> = {}): DuelmonSpecies['baseStats'] {
	return { atk: 10, def: 10, hp: 10, spa: 10, spd: 10, spe: 10, ...overrides };
}

function gen1Damage(overrides: Record<string, number> = {}): Record<string, number> {
	return { ...Object.fromEntries(GEN1_ATTACK_TYPES.map(type => [type, 0])), ...overrides };
}

function damageTaken(overrides: Record<string, number> = {}): Record<string, number> {
	return {
		...gen1Damage(),
		...Object.fromEntries(EXCLUDED_ATTACK_TYPES.map(type => [type, 0])),
		...overrides,
	};
}

function tables(): ShowdownTables {
	const typechart = Object.fromEntries(
		GEN1_ATTACK_TYPES.map(type => [type.toLowerCase(), { damageTaken: damageTaken() }])
	);

	return {
		gen1Moves: {
			ancient: {
				category: 'Physical',
				name: 'Ancient',
				num: 5,
				pp: 5,
				priority: 0,
				target: 'normal',
				type: 'Stone',
			},
			oath: {
				category: 'Status',
				name: 'Oath',
				pp: 10,
				priority: 0,
				target: 'self',
				type: 'Wraith',
			},
			spark: {
				accuracy: 90,
				inherit: true,
				pp: 20,
				priority: 1,
				secondary: { boosts: { spe: -1 }, chance: 33 },
				target: 'all',
				type: 'Aqua',
			},
			wild: {
				inherit: true,
				type: 'Aqua',
			},
		},
		gen1Pokedex: {
			afterguard: { baseStats: stats({ hp: 90 }), inherit: true },
			aquafin: { baseStats: stats({ spa: 80, spd: 80 }), inherit: true },
			emberling: { baseStats: stats({ atk: 77 }), inherit: true },
			glitch: { baseStats: stats(), inherit: true },
			stonelet: { baseStats: stats({ def: 150 }), inherit: true },
		},
		gen1Typechart: {
			bug: {
				damageTaken: damageTaken({
					Bug: 2,
					Ghost: 3,
					Poison: 1,
					Stellar: 1,
				}),
			},
			fire: { damageTaken: damageTaken({ Fire: 2, Ice: 0, Water: 1 }) },
		},
		moves: {
			future: {
				accuracy: 100,
				basePower: 100,
				category: 'Physical',
				flags: {},
				name: 'Future',
				num: 166,
				pp: 5,
				priority: 0,
				target: 'normal',
				type: 'Normal',
			},
			oath: {
				accuracy: true,
				basePower: 0,
				category: 'Status',
				flags: {},
				name: 'Oath',
				num: 3,
				pp: 30,
				priority: 0,
				target: 'self',
				type: 'Wraith',
			},
			spark: {
				accuracy: 100,
				basePower: 40,
				category: 'Special',
				flags: { protect: 1 },
				name: 'Spark',
				num: 2,
				pp: 25,
				priority: 0,
				target: 'normal',
				type: 'Ember',
			},
			strike: {
				accuracy: 100,
				basePower: 40,
				boosts: { def: -1 },
				category: 'Physical',
				critRatio: 2,
				drain: [1, 2],
				flags: { contact: 1 },
				multihit: [2, 5],
				name: 'Strike',
				num: 1,
				pp: 35,
				priority: 0,
				recoil: [33, 100],
				secondary: { chance: 10, status: 'burn' },
				status: 'paralysis',
				target: 'normal',
				type: 'Normal',
				volatileStatus: 'struck',
			},
			ward: {
				accuracy: 100,
				basePower: 60,
				boosts: { atk: 1 },
				category: 'Status',
				flags: { snatch: 1 },
				name: 'Ward',
				num: 4,
				pp: 20,
				priority: 0,
				target: 'self',
				type: 'Normal',
			},
			wild: {
				accuracy: 100,
				basePower: 50,
				category: 'Physical',
				flags: {},
				name: 'Wild',
				num: 5,
				pp: 20,
				priority: 0,
				target: 'normal',
				type: 'Normal',
			},
		},
		pokedex: {
			afterguard: {
				abilities: { 0: 'Resolve' },
				baseStats: stats(),
				name: 'Afterguard',
				num: 152,
				types: ['Stone'],
			},
			aquafin: {
				abilities: { 0: 'Current' },
				baseStats: stats({ spa: 40, spd: 40 }),
				name: 'Aquafin',
				num: 2,
				types: ['Aqua'],
			},
			emberling: {
				abilities: { 0: 'Emberheart' },
				baseStats: stats({ atk: 55 }),
				name: 'Emberling',
				num: 1,
				types: ['Ember'],
			},
			glitch: {
				abilities: { 0: 'Static' },
				baseStats: stats(),
				name: 'Glitch',
				num: 0,
				types: ['Normal'],
			},
			stonelet: {
				abilities: { 0: 'Bedrock' },
				baseStats: stats({ def: 120 }),
				name: 'Stonelet',
				num: 151,
				types: ['Stone'],
			},
		},
		typechart: {
			...typechart,
			dark: { damageTaken: damageTaken() },
			fairy: { damageTaken: damageTaken() },
			steel: { damageTaken: damageTaken() },
		},
	};
}

describe('buildDuelmonDataset', () => {
	it('keeps only the 151 Gen 1 species and merges inherited stats', () => {
		const dataset = buildDuelmonDataset({ commit: 'fixture-commit', tables: tables() });

		expect(dataset.species.map(species => species.id)).toEqual(['emberling', 'aquafin', 'stonelet']);
		expect(dataset.species[0]).toEqual({
			baseStats: stats({ atk: 77 }),
			id: 'emberling',
			name: 'Emberling',
			num: 1,
			types: ['Ember'],
		});
		expect(dataset.species[1]?.baseStats).toMatchObject({ spa: 80, spd: 80 });
	});

	it('keeps only Gen 1 moves, merges overrides, and derives the category', () => {
		const dataset = buildDuelmonDataset({ commit: 'fixture-commit', tables: tables() });
		const moves = new Map(dataset.moves.map(move => [move.id, move]));

		expect(dataset.moves.map(move => move.id)).toEqual(['strike', 'spark', 'oath', 'ward', 'wild']);
		expect(moves.get('strike')).toMatchObject({
			accuracy: 100,
			boosts: { def: -1 },
			category: 'Physical',
			critRatio: 2,
			drain: [1, 2],
			flags: { contact: 1 },
			multihit: [2, 5],
			power: 40,
			recoil: [33, 100],
			secondary: { chance: 10, status: 'burn' },
			status: 'paralysis',
			volatileStatus: 'struck',
		});
	});

	it('uses the base category and the merged type to classify a move', () => {
		const dataset = buildDuelmonDataset({ commit: 'fixture-commit', tables: tables() });
		const moves = new Map(dataset.moves.map(move => [move.id, move]));

		expect(moves.get('spark')).toMatchObject({
			accuracy: 90,
			category: 'Special',
			power: 40,
			priority: 1,
			secondary: { boosts: { spe: -1 }, chance: 33 },
			target: 'all',
			type: 'Aqua',
		});
		expect(moves.get('oath')).toMatchObject({ category: 'Status', name: 'Oath', pp: 10 });
		expect(moves.get('wild')).toMatchObject({ category: 'Special', type: 'Aqua' });
	});

	it('drops non-Gen 1 types from the chart and from every damage table', () => {
		const dataset = buildDuelmonDataset({ commit: 'fixture-commit', tables: tables() });

		expect(Object.keys(dataset.typechart)).toHaveLength(15);
		expect(dataset.typechart).not.toHaveProperty('dark');
		expect(dataset.typechart).not.toHaveProperty('fairy');
		expect(dataset.typechart).not.toHaveProperty('steel');
		expect(Object.keys(dataset.typechart['Bug'] ?? {})).toHaveLength(15);
		expect(dataset.typechart['Bug']).toEqual(gen1Damage({ Bug: 2, Ghost: 3, Poison: 1 }));
		expect(dataset.typechart['Fire']).toEqual(gen1Damage({ Fire: 2, Water: 1 }));
	});

	it('pins the source and omits Gen 1 abilities', () => {
		const dataset = buildDuelmonDataset({ commit: 'fixture-commit', tables: tables() });

		expect(dataset).toMatchObject({
			abilities: [],
			generation: 1,
			source: { commit: 'fixture-commit', repository: 'smogon/pokemon-showdown' },
		});
	});

	it('rejects an empty commit', () => {
		expect(() => buildDuelmonDataset({ commit: ' ', tables: tables() })).toThrow('Showdown commit');
	});
});
