import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { DuelmonAttributeDefinitions, DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { DuelmonMove, Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { Move as MoveEntity } from '@pocket-forge/move/domain';
import { describe, expect, it } from 'bun:test';

class MoveFixture {
	static catalog(): DuelmonCatalog {
		return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
	}

	static catalogMove(id: string): DuelmonMove {
		const found = this.catalog().findMove(id);

		if (!found) {
			throw new Error(`Missing fixture move "${id}"`);
		}

		return DuelmonMove.fromMove(found);
	}

	static move(overrides: AttributeValues = {}): DuelmonMove {
		return DuelmonMove.fromMove(
			MoveEntity.create(
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
			)
		);
	}
}

describe('Phase1MoveConstraints', () => {
	it('supports damaging moves that always hit with zero priority and no effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move())).toBeUndefined();
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('tackle'))).toBeUndefined();
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('ember-burst'))).toBeUndefined();
	});

	it('rejects Status moves', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ category: 'Status', power: 0 }))).toContain(
			'Status move'
		);
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('oath'))).toContain('Status move');
	});

	it('rejects moves without base power', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ power: 0 }))).toContain('base power');
	});

	it('rejects moves that can miss', () => {
		expect(
			Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ accuracy: 90, alwaysHits: false }))
		).toContain('can miss');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('ember-spark'))).toContain('can miss');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('gamble'))).toContain('can miss');
	});

	it('rejects moves with non-zero priority', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ priority: 1 }))).toContain('priority');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('quick-jab'))).toContain('priority');
	});

	it('rejects primary and volatile status effects', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ status: 'brn' }))).toContain(
			'primary status'
		);
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ volatileStatus: 'confusion' }))).toContain(
			'volatile status'
		);
	});

	it('rejects secondary effects', () => {
		expect(
			Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ secondary: { chance: 10, status: 'brn' } }))
		).toContain('secondary effect');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.catalogMove('flare'))).toContain('secondary effect');
	});

	it('rejects stat-stage changes', () => {
		expect(
			Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ boosts: [{ stages: 1, stat: 'atk' }] }))
		).toContain('stat stages');
	});

	it('rejects drain and recoil', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ drain: [1, 2] }))).toContain('drains');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ recoil: [33, 100] }))).toContain('recoils');
	});

	it('rejects multi-hit moves and high critical-hit ratios', () => {
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ multihit: [2, 5] }))).toContain(
			'multiple times'
		);
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ critRatio: 2 }))).toContain('critical-hit');
		expect(Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ critRatio: 1 }))).toBeUndefined();
	});

	it('rejects moves with turn or self-KO flags', () => {
		for (const flag of ['charge', 'mustrecharge', 'noreturn', 'recharge'] as const) {
			expect(
				Phase1MoveConstraints.unsupportedReason(MoveFixture.move({ flags: [{ name: flag, value: 1 }] }))
			).toContain(flag);
		}
	});

	it('allows moves with benign flags', () => {
		expect(
			Phase1MoveConstraints.unsupportedReason(
				MoveFixture.move({
					flags: [
						{ name: 'contact', value: 1 },
						{ name: 'protect', value: 1 },
					],
				})
			)
		).toBeUndefined();
	});
});
