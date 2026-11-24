import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { DuelmonAttributeDefinitions, DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import type { Move } from '@pocket-forge/move/domain';
import { Move as MoveEntity } from '@pocket-forge/move/domain';
import { describe, expect, it } from 'bun:test';

function catalog(): DuelmonCatalog {
	return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
}

function catalogMove(id: string): Move {
	const found = catalog().findMove(id);

	if (!found) {
		throw new Error(`Missing fixture move "${id}"`);
	}

	return found;
}

function move(overrides: AttributeValues = {}): Move {
	return MoveEntity.create(
		'test-move',
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
	);
}

describe('Phase1MoveConstraints', () => {
	it('supports damaging moves that always hit with zero priority and no effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move())).toBeUndefined();
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('tackle'))).toBeUndefined();
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('ember-burst'))).toBeUndefined();
	});

	it('rejects Status moves', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ category: 'Status', power: 0 }))).toContain(
			'Status move'
		);
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('oath'))).toContain('Status move');
	});

	it('rejects moves without base power', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ power: 0 }))).toContain('base power');
	});

	it('rejects moves that can miss', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ accuracy: 90, alwaysHits: false }))).toContain(
			'can miss'
		);
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('ember-spark'))).toContain('can miss');
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('gamble'))).toContain('can miss');
	});

	it('rejects moves with non-zero priority', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ priority: 1 }))).toContain('priority');
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('quick-jab'))).toContain('priority');
	});

	it('rejects primary and volatile status effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ status: 'brn' }))).toContain('primary status');
		expect(Phase1MoveConstraints.unsupportedReason(move({ volatileStatus: 'confusion' }))).toContain(
			'volatile status'
		);
	});

	it('rejects secondary effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ secondary: { chance: 10, status: 'brn' } }))).toContain(
			'secondary effect'
		);
		expect(Phase1MoveConstraints.unsupportedReason(catalogMove('flare'))).toContain('secondary effect');
	});

	it('rejects stat-stage changes', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ boosts: [{ stages: 1, stat: 'atk' }] }))).toContain(
			'stat stages'
		);
	});

	it('rejects drain and recoil', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ drain: [1, 2] }))).toContain('drains');
		expect(Phase1MoveConstraints.unsupportedReason(move({ recoil: [33, 100] }))).toContain('recoils');
	});

	it('rejects multi-hit moves and high critical-hit ratios', () => {
		expect(Phase1MoveConstraints.unsupportedReason(move({ multihit: [2, 5] }))).toContain('multiple times');
		expect(Phase1MoveConstraints.unsupportedReason(move({ critRatio: 2 }))).toContain('critical-hit');
		expect(Phase1MoveConstraints.unsupportedReason(move({ critRatio: 1 }))).toBeUndefined();
	});
});
