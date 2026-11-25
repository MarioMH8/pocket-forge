import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonMove } from '@pocket-forge/duelmon-dataset';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { describe, expect, it } from 'bun:test';

function catalog(): DuelmonCatalog {
	return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
}

describe('DuelmonCatalog.fromDataset', () => {
	it('maps dataset species and moves to neutral catalog entities', () => {
		const result = DuelmonCatalog.fromDataset(DuelmonDatasetMother.create());
		const current = result.getRight();
		const species = current.findSpecies('stonelet');
		const move = current.findMove('ember-burst');

		expect(result.isRight()).toBe(true);
		expect(current.species).toHaveLength(7);
		expect(current.moves).toHaveLength(9);
		expect(species?.id).toBe('stonelet');
		expect(species?.attributes.value).toMatchObject({
			baseAtk: 80,
			baseDef: 120,
			baseHp: 60,
			baseSpecial: 50,
			baseSpeed: 50,
			types: ['Rock', 'Ground'],
		});
		expect(move?.id).toBe('ember-burst');
		expect(move?.attributes.value).toMatchObject({
			accuracy: 100,
			alwaysHits: true,
			category: 'Special',
			power: 40,
			pp: 25,
			priority: 0,
			type: 'Fire',
		});
	});

	it('maps numeric accuracy to a hit check', () => {
		expect(catalog().findMove('ember-spark')?.attributes.value).toMatchObject({
			accuracy: 90,
			alwaysHits: false,
		});
	});

	it('returns undefined for unknown identifiers', () => {
		const current = catalog();

		expect(current.findMove('missing')).toBeUndefined();
		expect(current.findSpecies('missing')).toBeUndefined();
	});

	describe('move effects', () => {
		function move(overrides: Partial<DuelmonMove> & Pick<DuelmonMove, 'id'>): DuelmonMove {
			return {
				accuracy: true,
				category: 'Physical',
				flags: {},
				name: overrides.id,
				power: 40,
				pp: 35,
				priority: 0,
				target: 'normal',
				type: 'Normal',
				...overrides,
			};
		}

		function catalogWith(moves: readonly DuelmonMove[]): DuelmonCatalog {
			return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create({ moves })).getRight();
		}

		it('maps Showdown flags to typed records', () => {
			const current = catalogWith([
				move({ flags: { charge: 1, contact: 1 }, id: 'flagged-move' }),
				move({ flags: {}, id: 'unflagged-move' }),
			]);

			expect(current.findMove('flagged-move')?.attributes.toPrimitives()).toMatchObject({
				flags: [
					{ name: 'charge', value: 1 },
					{ name: 'contact', value: 1 },
				],
			});
			expect(current.findMove('unflagged-move')?.attributes.toPrimitives()).not.toHaveProperty('flags');
		});

		it('maps primary status, volatile status, and stat stages', () => {
			const current = catalogWith([
				move({ id: 'status-move', status: 'brn' }),
				move({ id: 'volatile-move', volatileStatus: 'confusion' }),
				move({ boosts: { atk: 2 }, id: 'boost-move', target: 'self' }),
			]);

			expect(current.findMove('status-move')?.attributes.toPrimitives()).toMatchObject({ status: 'brn' });
			expect(current.findMove('volatile-move')?.attributes.toPrimitives()).toMatchObject({
				volatileStatus: 'confusion',
			});
			expect(current.findMove('boost-move')?.attributes.toPrimitives()).toMatchObject({
				boosts: [{ stages: 2, stat: 'atk' }],
			});
		});

		it('maps secondary effects with nested boosts', () => {
			const current = catalogWith([
				move({
					id: 'secondary-move',
					secondary: {
						boosts: { def: -1 },
						chance: 10,
						self: { boosts: { spa: 1 } },
						status: 'brn',
						volatileStatus: 'flinch',
					},
				}),
			]);

			expect(current.findMove('secondary-move')?.attributes.toPrimitives()).toMatchObject({
				secondary: {
					boosts: [{ stages: -1, stat: 'def' }],
					chance: 10,
					self: { boosts: [{ stages: 1, stat: 'spa' }] },
					status: 'brn',
					volatileStatus: 'flinch',
				},
			});
		});

		it('maps drain, recoil, multihit, and critical-hit ratio', () => {
			const current = catalogWith([
				move({ drain: [1, 2], id: 'drain-move' }),
				move({ id: 'recoil-move', recoil: [33, 100] }),
				move({ id: 'range-move', multihit: [2, 5] }),
				move({ id: 'fixed-move', multihit: 3 }),
				move({ critRatio: 2, id: 'crit-move' }),
			]);

			expect(current.findMove('drain-move')?.attributes.toPrimitives()).toMatchObject({ drain: [1, 2] });
			expect(current.findMove('recoil-move')?.attributes.toPrimitives()).toMatchObject({ recoil: [33, 100] });
			expect(current.findMove('range-move')?.attributes.toPrimitives()).toMatchObject({ multihit: [2, 5] });
			expect(current.findMove('fixed-move')?.attributes.toPrimitives()).toMatchObject({ multihit: [3, 3] });
			expect(current.findMove('crit-move')?.attributes.toPrimitives()).toMatchObject({ critRatio: 2 });
		});

		it('rejects moves with invalid effect data', () => {
			const result = DuelmonCatalog.fromDataset(
				DuelmonDatasetMother.create({ moves: [move({ drain: [1] as never, id: 'broken-move' })] })
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.message).toContain('Invalid Duelmon move "broken-move"');
		});
	});

	describe('typeMultipliers', () => {
		const current = catalog();

		it('returns one multiplier per defender type', () => {
			expect(current.typeMultipliers('Ice', ['Water', 'Flying'])).toEqual([0.5, 2]);
			expect(current.typeMultipliers('Water', ['Rock', 'Ground'])).toEqual([2, 2]);
			expect(current.typeMultipliers('Normal', ['Water'])).toEqual([1]);
		});

		it('resolves weak, resisted, and immune matchups', () => {
			expect(current.typeMultipliers('Water', ['Fire'])).toEqual([2]);
			expect(current.typeMultipliers('Fire', ['Fire'])).toEqual([0.5]);
			expect(current.typeMultipliers('Normal', ['Ghost'])).toEqual([0]);
		});

		it('keeps zero for an immune matchup across a dual type', () => {
			expect(current.typeMultipliers('Normal', ['Ghost', 'Water'])).toEqual([0, 1]);
		});

		it('does not throw for a matchup the validated chart does not know', () => {
			expect(current.typeMultipliers('Water', ['Cosmic' as never])).toEqual([1]);
		});
	});

	describe('invalid datasets', () => {
		it('rejects a species outside the declared stat range', () => {
			const dataset = DuelmonDatasetMother.create();
			const species = dataset.species.map(entry =>
				entry.id === 'emberling' ? { ...entry, baseStats: { ...entry.baseStats, hp: 0 } } : entry
			);
			const result = DuelmonCatalog.fromDataset({ ...dataset, species });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.message).toContain('Invalid Duelmon species "emberling"');
		});

		it('rejects a species with a type outside Gen 1', () => {
			const dataset = DuelmonDatasetMother.create();
			const species = dataset.species.map(entry =>
				entry.id === 'wisp' ? { ...entry, types: ['Fairy' as never] } : entry
			);
			const result = DuelmonCatalog.fromDataset({ ...dataset, species });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.message).toContain('Invalid Duelmon species "wisp": unknown type "Fairy"');
		});

		it('rejects a move with a type outside Gen 1', () => {
			const dataset = DuelmonDatasetMother.create();
			const moves = dataset.moves.map(entry =>
				entry.id === 'tackle' ? { ...entry, type: 'Cosmic' as never } : entry
			);
			const result = DuelmonCatalog.fromDataset({ ...dataset, moves });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.message).toContain('Invalid Duelmon move "tackle"');
		});

		it('rejects duplicated identifiers', () => {
			const dataset = DuelmonDatasetMother.create();
			const firstMove = dataset.moves[0];

			if (!firstMove) {
				throw new Error('Fixture dataset requires at least one move');
			}

			const moves = [...dataset.moves, firstMove];
			const result = DuelmonCatalog.fromDataset({ ...dataset, moves });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('duplicate-id');
		});

		it('rejects an unknown type chart relation value', () => {
			const dataset = DuelmonDatasetMother.create();
			const result = DuelmonCatalog.fromDataset({
				...dataset,
				typechart: DuelmonDatasetMother.typechart({ Fire: { Fire: 4 } }),
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.message).toContain('Invalid Duelmon type chart');
		});

		it('rejects a type chart without every defender relation', () => {
			const dataset = DuelmonDatasetMother.create();
			const typechart = DuelmonDatasetMother.typechart();
			const fire = { ...typechart['Fire'] };

			delete fire['Dragon'];

			const result = DuelmonCatalog.fromDataset({
				...dataset,
				typechart: { ...typechart, Fire: fire },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.path).toBe('typechart.Fire.Dragon');
		});
	});
});
