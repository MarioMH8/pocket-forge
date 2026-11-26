import type { CombatantGroup } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import { CombatRuleMother } from '@pocket-forge/combat-engine/mother/domain';
import type { CombatCompositionRulePrimitives } from '@pocket-forge/combat-engine/rules';
import { OneVersusOneCombatRule, TwoVersusTwoCombatRule } from '@pocket-forge/combat-engine/rules';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS } from './rules.fixtures';

class CompositionFixture {
	static group(id: string, combatants: number): CombatantGroup {
		return CombatantGroupMother.create({
			combatants: Array.from({ length: combatants }, (_, index) =>
				CombatantMother.primitives({ groupId: id, id: `${id}-combatant-${String(index)}` })
			),
			id,
		});
	}

	static primitives(
		groupConstraints: CombatCompositionRulePrimitives['groupConstraints'],
		overrides?: Partial<CombatCompositionRulePrimitives>
	): CombatCompositionRulePrimitives {
		return CombatRuleMother.primitives({
			groupConstraints: { ...groupConstraints },
			...overrides,
		});
	}
}

describe('OneVersusOneCombatRule', () => {
	it('declares its composition constraints', () => {
		expect(OneVersusOneCombatRule.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 1,
			maxGroups: 2,
			minCombatantsPerGroup: 1,
			minGroups: 2,
		});
	});

	it('hydrates a rule from primitives', () => {
		const result = OneVersusOneCombatRule.create(
			CompositionFixture.primitives(OneVersusOneCombatRule.CONSTRAINTS),
			[...ATTRIBUTE_DEFINITIONS]
		);

		expect(result.isRight()).toBe(true);

		const rule = result.getRight();
		expect(rule).toBeInstanceOf(OneVersusOneCombatRule);
		expect(rule.groupConstraints).toEqual(OneVersusOneCombatRule.CONSTRAINTS);
	});

	it('rejects mismatched composition constraints', () => {
		const result = OneVersusOneCombatRule.create(
			CompositionFixture.primitives({
				...OneVersusOneCombatRule.CONSTRAINTS,
				maxCombatantsPerGroup: 3,
			}),
			[]
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		expect(result.getLeft()[0]?.path).toBe('groupConstraints.maxCombatantsPerGroup');
	});

	it('accepts exactly two groups with one combatant each', () => {
		const rule = OneVersusOneCombatRule.create(
			CompositionFixture.primitives(OneVersusOneCombatRule.CONSTRAINTS),
			[]
		).getRight();

		expect(
			rule
				.validateComposition([CompositionFixture.group('alpha', 1), CompositionFixture.group('beta', 1)])
				.isRight()
		).toBe(true);
	});

	it('rejects a group with more than one combatant', () => {
		const rule = OneVersusOneCombatRule.create(
			CompositionFixture.primitives(OneVersusOneCombatRule.CONSTRAINTS),
			[]
		).getRight();

		const result = rule.validateComposition([
			CompositionFixture.group('alpha', 2),
			CompositionFixture.group('beta', 1),
		]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
		expect(result.getLeft()[0]?.message).toContain('at most 1 combatant(s)');
	});

	it('round-trips primitives', () => {
		const source = CompositionFixture.primitives(OneVersusOneCombatRule.CONSTRAINTS);

		const result = OneVersusOneCombatRule.create(source, []);

		expect(result.getRight().toPrimitives()).toEqual(source);
	});
});

describe('TwoVersusTwoCombatRule', () => {
	it('declares its composition constraints', () => {
		expect(TwoVersusTwoCombatRule.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 2,
			maxGroups: 2,
			minCombatantsPerGroup: 2,
			minGroups: 2,
		});
	});

	it('hydrates a rule from primitives', () => {
		const result = TwoVersusTwoCombatRule.create(
			CompositionFixture.primitives(TwoVersusTwoCombatRule.CONSTRAINTS),
			[]
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(TwoVersusTwoCombatRule);
	});

	it('rejects mismatched composition constraints', () => {
		const result = TwoVersusTwoCombatRule.create(
			CompositionFixture.primitives({
				...TwoVersusTwoCombatRule.CONSTRAINTS,
				minCombatantsPerGroup: 1,
			}),
			[]
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		expect(result.getLeft()[0]?.path).toBe('groupConstraints.minCombatantsPerGroup');
	});

	it('accepts exactly two groups with two combatants each', () => {
		const rule = TwoVersusTwoCombatRule.create(
			CompositionFixture.primitives(TwoVersusTwoCombatRule.CONSTRAINTS),
			[]
		).getRight();

		expect(
			rule
				.validateComposition([CompositionFixture.group('alpha', 2), CompositionFixture.group('beta', 2)])
				.isRight()
		).toBe(true);
	});

	it('round-trips primitives', () => {
		const source = CompositionFixture.primitives(TwoVersusTwoCombatRule.CONSTRAINTS);

		const result = TwoVersusTwoCombatRule.create(source, []);

		expect(result.getRight().toPrimitives()).toEqual(source);
	});
});
