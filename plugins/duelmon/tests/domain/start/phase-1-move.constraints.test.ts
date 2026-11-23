import { Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
import type { DuelmonMove } from '@pocket-forge/duelmon-dataset';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { describe, expect, it } from 'bun:test';

function constraints(): Phase1MoveConstraints {
	return Phase1MoveConstraints.fromMoves(DuelmonDatasetMother.moves());
}

function entry(id: string): DuelmonMove {
	const found = DuelmonDatasetMother.moves().find(move => move.id === id);

	if (!found) {
		throw new Error(`Missing fixture move "${id}"`);
	}

	return found;
}

function constraintsWith(overrides: DuelmonMove): Phase1MoveConstraints {
	return Phase1MoveConstraints.fromMoves([
		...DuelmonDatasetMother.moves().filter(move => move.id !== overrides.id),
		overrides,
	]);
}

describe('Phase1MoveConstraints', () => {
	it('supports damaging moves that always hit with zero priority and no effects', () => {
		expect(constraints().unsupportedReason('tackle')).toBeUndefined();
		expect(constraints().unsupportedReason('ember-burst')).toBeUndefined();
	});

	it('rejects Status moves', () => {
		expect(constraints().unsupportedReason('oath')).toContain('Status move');
	});

	it('rejects moves without base power', () => {
		expect(constraintsWith({ ...entry('tackle'), power: 0 }).unsupportedReason('tackle')).toContain('base power');
	});

	it('rejects moves that can miss', () => {
		expect(constraints().unsupportedReason('ember-spark')).toContain('can miss');
		expect(constraints().unsupportedReason('gamble')).toContain('can miss');
	});

	it('rejects moves with non-zero priority', () => {
		expect(constraints().unsupportedReason('quick-jab')).toContain('priority');
	});

	it('rejects primary and volatile status effects', () => {
		expect(constraintsWith({ ...entry('tackle'), status: 'burn' }).unsupportedReason('tackle')).toContain(
			'primary status'
		);
		expect(
			constraintsWith({ ...entry('tackle'), volatileStatus: 'confusion' }).unsupportedReason('tackle')
		).toContain('volatile status');
	});

	it('rejects secondary effects', () => {
		expect(constraints().unsupportedReason('flare')).toContain('secondary effect');
	});

	it('rejects stat-stage changes', () => {
		expect(constraintsWith({ ...entry('tackle'), boosts: { attack: 1 } }).unsupportedReason('tackle')).toContain(
			'stat stages'
		);
	});

	it('rejects drain and recoil', () => {
		expect(constraintsWith({ ...entry('tackle'), drain: [1, 2] }).unsupportedReason('tackle')).toContain('drains');
		expect(constraintsWith({ ...entry('tackle'), recoil: [1, 3] }).unsupportedReason('tackle')).toContain(
			'recoils'
		);
	});

	it('rejects multi-hit moves and high critical-hit ratios', () => {
		expect(constraintsWith({ ...entry('tackle'), multihit: [2, 5] }).unsupportedReason('tackle')).toContain(
			'multiple times'
		);
		expect(constraintsWith({ ...entry('tackle'), critRatio: 2 }).unsupportedReason('tackle')).toContain(
			'critical-hit'
		);
		expect(constraintsWith({ ...entry('tackle'), critRatio: 1 }).unsupportedReason('tackle')).toBeUndefined();
	});

	it('rejects moves outside the Phase 1 content', () => {
		expect(constraints().unsupportedReason('missing')).toContain('not part of the Phase 1 content');
	});
});
