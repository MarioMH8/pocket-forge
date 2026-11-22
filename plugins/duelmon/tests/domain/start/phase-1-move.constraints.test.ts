import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
import type { DuelmonMove } from '@pocket-forge/duelmon-dataset';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { describe, expect, it } from 'bun:test';

function catalog(): DuelmonCatalog {
	return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
}

function entry(id: string): DuelmonMove {
	const found = catalog().findMoveEntry(id);

	if (!found) {
		throw new Error(`Missing fixture move "${id}"`);
	}

	return found;
}

describe('Phase1MoveConstraints.unsupportedReason', () => {
	it('supports damaging moves that always hit with zero priority and no effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(entry('tackle'))).toBeUndefined();
		expect(Phase1MoveConstraints.unsupportedReason(entry('ember-burst'))).toBeUndefined();
	});

	it('rejects Status moves', () => {
		expect(Phase1MoveConstraints.unsupportedReason(entry('oath'))).toContain('Status move');
	});

	it('rejects moves without base power', () => {
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), power: 0 })).toContain('base power');
	});

	it('rejects moves that can miss', () => {
		expect(Phase1MoveConstraints.unsupportedReason(entry('ember-spark'))).toContain('can miss');
		expect(Phase1MoveConstraints.unsupportedReason(entry('gamble'))).toContain('can miss');
	});

	it('rejects moves with non-zero priority', () => {
		expect(Phase1MoveConstraints.unsupportedReason(entry('quick-jab'))).toContain('priority');
	});

	it('rejects primary and volatile status effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), status: 'burn' })).toContain(
			'primary status'
		);
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), volatileStatus: 'confusion' })).toContain(
			'volatile status'
		);
	});

	it('rejects secondary effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(entry('flare'))).toContain('secondary effect');
	});

	it('rejects stat-stage changes', () => {
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), boosts: { attack: 1 } })).toContain(
			'stat stages'
		);
	});

	it('rejects drain and recoil', () => {
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), drain: [1, 2] })).toContain('drains');
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), recoil: [1, 3] })).toContain('recoils');
	});

	it('rejects multi-hit moves and high critical-hit ratios', () => {
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), multihit: [2, 5] })).toContain(
			'multiple times'
		);
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), critRatio: 2 })).toContain('critical-hit');
		expect(Phase1MoveConstraints.unsupportedReason({ ...entry('tackle'), critRatio: 1 })).toBeUndefined();
	});
});
