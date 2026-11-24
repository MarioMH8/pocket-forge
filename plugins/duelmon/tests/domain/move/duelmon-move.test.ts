import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { DuelmonAttributeDefinitions, DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { DuelmonMove } from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { Move } from '@pocket-forge/move/domain';
import { describe, expect, it } from 'bun:test';

function catalog(): DuelmonCatalog {
	return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
}

function catalogMove(id: string): DuelmonMove {
	const found = catalog().findMove(id);

	if (!found) {
		throw new Error(`Missing fixture move "${id}"`);
	}

	return DuelmonMove.fromMove(found);
}

function syntheticMove(overrides: AttributeValues = {}): DuelmonMove {
	return DuelmonMove.fromMove(
		Move.create(
			'all-effects',
			{
				accuracy: 100,
				alwaysHits: true,
				category: 'Physical',
				power: 40,
				pp: 35,
				priority: 0,
				type: 'Normal',
				...overrides,
			},
			[...DuelmonAttributeDefinitions.MOVE]
		)
	);
}

describe('DuelmonMove', () => {
	it('exposes the neutral move attributes as typed getters', () => {
		const move = catalogMove('tackle');

		expect(move.attributes).toEqual({
			accuracy: 100,
			alwaysHits: true,
			category: 'Physical',
			power: 35,
			pp: 35,
			priority: 0,
			type: 'Normal',
		});
		expect(move.isDamaging).toBe(true);
		expect(move.isStatus).toBe(false);
		expect(move.hasPrimaryStatus).toBe(false);
		expect(move.hasVolatileStatus).toBe(false);
		expect(move.hasSecondaryEffect).toBe(false);
		expect(move.changesStages).toBe(false);
		expect(move.drains).toBe(false);
		expect(move.recoils).toBe(false);
		expect(move.isMultiHit).toBe(false);
		expect(move.hasHighCritRatio).toBe(false);
	});

	it('distinguishes Status moves', () => {
		const move = catalogMove('oath');

		expect(move.isStatus).toBe(true);
		expect(move.isDamaging).toBe(false);
		expect(move.power).toBe(0);
	});

	it('exposes secondary effects and priority', () => {
		expect(catalogMove('flare').secondary).toEqual({ chance: 10, status: 'burn' });
		expect(catalogMove('flare').hasSecondaryEffect).toBe(true);
		expect(catalogMove('quick-jab').priority).toBe(1);
	});

	it('exposes accuracy below 100', () => {
		expect(catalogMove('ember-spark').accuracy).toBe(90);
		expect(catalogMove('ember-spark').alwaysHits).toBe(false);
	});

	it('parses every effect declaration', () => {
		const move = syntheticMove({
			boosts: [{ stages: 1, stat: 'atk' }],
			critRatio: 2,
			drain: [1, 2],
			multihit: [2, 5],
			recoil: [33, 100],
			secondary: {
				boosts: [{ stages: -1, stat: 'def' }],
				chance: 10,
				self: { boosts: [{ stages: 1, stat: 'spa' }] },
				status: 'brn',
				volatileStatus: 'flinch',
			},
			status: 'brn',
			volatileStatus: 'confusion',
		});

		expect(move.hasPrimaryStatus).toBe(true);
		expect(move.hasVolatileStatus).toBe(true);
		expect(move.hasSecondaryEffect).toBe(true);
		expect(move.changesStages).toBe(true);
		expect(move.drains).toBe(true);
		expect(move.recoils).toBe(true);
		expect(move.isMultiHit).toBe(true);
		expect(move.hasHighCritRatio).toBe(true);
		expect(move.boosts).toEqual([{ stages: 1, stat: 'atk' }]);
		expect(move.secondary).toEqual({
			boosts: [{ stages: -1, stat: 'def' }],
			chance: 10,
			self: { boosts: [{ stages: 1, stat: 'spa' }] },
			status: 'brn',
			volatileStatus: 'flinch',
		});
		expect(move.drain).toEqual([1, 2]);
		expect(move.recoil).toEqual([33, 100]);
		expect(move.multihit).toEqual([2, 5]);
		expect(move.critRatio).toBe(2);
	});

	it('treats a critical ratio of 1 as normal', () => {
		expect(syntheticMove({ critRatio: 1 }).hasHighCritRatio).toBe(false);
	});

	it('round-trips the wrapped snapshot', () => {
		const move = catalogMove('flare');

		expect(DuelmonMove.fromPrimitives(move.toPrimitives()).toPrimitives()).toEqual(move.toPrimitives());
	});

	it('throws when a required attribute is missing', () => {
		const move = DuelmonMove.fromPrimitives({ attributes: {}, id: 'broken' });

		expect(() => move.power).toThrow();
	});
});
