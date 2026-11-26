import type { DuelmonSpecies, ShowdownTables } from '@pocket-forge/duelmon-dataset';
import { DuelmonDatasetBuilder, DuelmonTypes } from '@pocket-forge/duelmon-dataset';
import { describe, expect, it } from 'bun:test';

const EXCLUDED_ATTACK_TYPES = ['Dark', 'Steel', 'Fairy', 'Stellar'] as const;

class DatasetFixture {
	static damageTaken(overrides: Record<string, number> = {}): Record<string, number> {
		return {
			...this.gen1Damage(),
			...Object.fromEntries(EXCLUDED_ATTACK_TYPES.map(type => [type, 0])),
			...overrides,
		};
	}

	static gen1Damage(overrides: Record<string, number> = {}): Record<string, number> {
		return { ...Object.fromEntries(DuelmonTypes.ALL.map(type => [type, 0])), ...overrides };
	}

	static stats(overrides: Partial<DuelmonSpecies['baseStats']> = {}): DuelmonSpecies['baseStats'] {
		return { atk: 10, def: 10, hp: 10, spa: 10, spd: 10, spe: 10, ...overrides };
	}

	static tables(): ShowdownTables {
		const typechart = Object.fromEntries(
			DuelmonTypes.ALL.map(type => [type.toLowerCase(), { damageTaken: this.damageTaken() }])
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
					type: 'Rock',
				},
				oath: {
					category: 'Status',
					name: 'Oath',
					pp: 10,
					priority: 0,
					target: 'self',
					type: 'Ghost',
				},
				spark: {
					accuracy: 90,
					inherit: true,
					pp: 20,
					priority: 1,
					secondary: { boosts: { spe: -1 }, chance: 33 },
					target: 'all',
					type: 'Water',
				},
				wild: {
					inherit: true,
					type: 'Water',
				},
			},
			gen1Pokedex: {
				afterguard: { baseStats: this.stats({ hp: 90 }), inherit: true },
				aquafin: { baseStats: this.stats({ spa: 80, spd: 80 }), inherit: true },
				emberling: { baseStats: this.stats({ atk: 77 }), inherit: true },
				glitch: { baseStats: this.stats(), inherit: true },
				stonelet: { baseStats: this.stats({ def: 150 }), inherit: true },
			},
			gen1Typechart: {
				bug: {
					damageTaken: this.damageTaken({
						Bug: 2,
						Ghost: 3,
						Poison: 1,
						Stellar: 1,
					}),
				},
				fire: { damageTaken: this.damageTaken({ Fire: 2, Ice: 0, Water: 1 }) },
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
					type: 'Ghost',
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
					type: 'Fire',
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
					baseStats: this.stats(),
					name: 'Afterguard',
					num: 152,
					types: ['Rock'],
				},
				aquafin: {
					abilities: { 0: 'Current' },
					baseStats: this.stats({ spa: 40, spd: 40 }),
					name: 'Aquafin',
					num: 2,
					types: ['Water'],
				},
				emberling: {
					abilities: { 0: 'Emberheart' },
					baseStats: this.stats({ atk: 55 }),
					name: 'Emberling',
					num: 1,
					types: ['Fire'],
				},
				glitch: {
					abilities: { 0: 'Static' },
					baseStats: this.stats(),
					name: 'Glitch',
					num: 0,
					types: ['Normal'],
				},
				stonelet: {
					abilities: { 0: 'Bedrock' },
					baseStats: this.stats({ def: 120 }),
					name: 'Stonelet',
					num: 151,
					types: ['Rock'],
				},
			},
			typechart: {
				...typechart,
				dark: { damageTaken: this.damageTaken() },
				fairy: { damageTaken: this.damageTaken() },
				steel: { damageTaken: this.damageTaken() },
			},
		};
	}
}

describe('DuelmonDatasetBuilder.build', () => {
	it('keeps only the 151 Gen 1 species and merges inherited stats', () => {
		const dataset = DuelmonDatasetBuilder.build({ commit: 'fixture-commit', tables: DatasetFixture.tables() });

		expect(dataset.species.map(species => species.id)).toEqual(['emberling', 'aquafin', 'stonelet']);
		expect(dataset.species[0]).toEqual({
			baseStats: DatasetFixture.stats({ atk: 77 }),
			id: 'emberling',
			name: 'Emberling',
			num: 1,
			types: ['Fire'],
		});
		expect(dataset.species[1]?.baseStats).toMatchObject({ spa: 80, spd: 80 });
	});

	it('keeps only Gen 1 moves, merges overrides, and derives the category', () => {
		const dataset = DuelmonDatasetBuilder.build({ commit: 'fixture-commit', tables: DatasetFixture.tables() });
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
		const dataset = DuelmonDatasetBuilder.build({ commit: 'fixture-commit', tables: DatasetFixture.tables() });
		const moves = new Map(dataset.moves.map(move => [move.id, move]));

		expect(moves.get('spark')).toMatchObject({
			accuracy: 90,
			category: 'Special',
			power: 40,
			priority: 1,
			secondary: { boosts: { spe: -1 }, chance: 33 },
			target: 'all',
			type: 'Water',
		});
		expect(moves.get('oath')).toMatchObject({ category: 'Status', name: 'Oath', pp: 10 });
		expect(moves.get('wild')).toMatchObject({ category: 'Special', type: 'Water' });
	});

	it('drops Fairy and falls back to Normal when no Gen 1 type remains', () => {
		const fixture = DatasetFixture.tables();
		const dataset = DuelmonDatasetBuilder.build({
			commit: 'fixture-commit',
			tables: {
				...fixture,
				pokedex: {
					...fixture.pokedex,
					aquafin: {
						...(fixture.pokedex['aquafin'] as Record<string, unknown>),
						types: ['Water', 'Fairy'],
					},
					emberling: {
						...(fixture.pokedex['emberling'] as Record<string, unknown>),
						types: ['Fairy'],
					},
				},
			},
		});
		const species = new Map(dataset.species.map(entry => [entry.id, entry]));

		expect(species.get('emberling')?.types).toEqual(['Normal']);
		expect(species.get('aquafin')?.types).toEqual(['Water']);
	});

	it('normalizes ??? move types to Normal', () => {
		const fixture = DatasetFixture.tables();
		const dataset = DuelmonDatasetBuilder.build({
			commit: 'fixture-commit',
			tables: {
				...fixture,
				moves: {
					...fixture.moves,
					bide: {
						accuracy: 100,
						basePower: 0,
						category: 'Physical',
						flags: {},
						name: 'Bide',
						num: 6,
						pp: 10,
						priority: 0,
						target: 'self',
						type: '???',
					},
				},
			},
		});
		const moves = new Map(dataset.moves.map(move => [move.id, move]));

		expect(moves.get('bide')).toMatchObject({ category: 'Physical', power: 0, type: 'Normal' });
	});

	it('drops non-Gen 1 types from the chart and from every damage table', () => {
		const dataset = DuelmonDatasetBuilder.build({ commit: 'fixture-commit', tables: DatasetFixture.tables() });

		expect(Object.keys(dataset.typechart)).toHaveLength(15);
		expect(dataset.typechart).not.toHaveProperty('dark');
		expect(dataset.typechart).not.toHaveProperty('fairy');
		expect(dataset.typechart).not.toHaveProperty('steel');
		expect(Object.keys(dataset.typechart['Bug'] ?? {})).toHaveLength(15);
		expect(dataset.typechart['Bug']).toEqual(DatasetFixture.gen1Damage({ Bug: 2, Ghost: 3, Poison: 1 }));
		expect(dataset.typechart['Fire']).toEqual(DatasetFixture.gen1Damage({ Fire: 2, Water: 1 }));
	});

	it('pins the source and omits Gen 1 abilities', () => {
		const dataset = DuelmonDatasetBuilder.build({ commit: 'fixture-commit', tables: DatasetFixture.tables() });

		expect(dataset).toMatchObject({
			abilities: [],
			generation: 1,
			source: { commit: 'fixture-commit', repository: 'smogon/pokemon-showdown' },
		});
	});

	it('rejects an empty commit', () => {
		expect(() => DuelmonDatasetBuilder.build({ commit: ' ', tables: DatasetFixture.tables() })).toThrow(
			'Showdown commit'
		);
	});
});
