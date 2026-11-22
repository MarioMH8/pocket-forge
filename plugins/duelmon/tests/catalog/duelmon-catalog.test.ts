import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
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

	it('exposes the source entry of a move', () => {
		const current = catalog();

		expect(current.findMoveEntry('tackle')).toMatchObject({
			accuracy: true,
			category: 'Physical',
			id: 'tackle',
			power: 35,
			priority: 0,
			type: 'Normal',
		});
		expect(current.findMoveEntry('flare')?.secondary).toEqual({ chance: 10, status: 'burn' });
		expect(current.findMoveEntry('missing')).toBeUndefined();
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
