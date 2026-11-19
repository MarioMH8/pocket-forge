import type { CombatantGroup } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import type { CombatGroupConstraints, CombatRulesetPrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatRulesetMother } from '@pocket-forge/combat-engine/mother/domain';
import { OneVersusOneCombatRuleset, TwoVersusTwoCombatRuleset } from '@pocket-forge/combat-engine/rulesets';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS } from './rulesets.fixtures';

function primitives(
	groupConstraints: CombatGroupConstraints,
	overrides?: Partial<CombatRulesetPrimitives>
): CombatRulesetPrimitives {
	return CombatRulesetMother.primitives({
		groupConstraints: { ...groupConstraints },
		...overrides,
	});
}

function group(id: string, combatants: number): CombatantGroup {
	return CombatantGroupMother.create({
		combatants: Array.from({ length: combatants }, (_, index) =>
			CombatantMother.primitives({ groupId: id, id: `${id}-combatant-${String(index)}` })
		),
		id,
	});
}

describe('OneVersusOneCombatRuleset', () => {
	it('declares its composition constraints', () => {
		expect(OneVersusOneCombatRuleset.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 1,
			maxGroups: 2,
			minCombatantsPerGroup: 1,
			minGroups: 2,
		});
	});

	it('hydrates a ruleset from primitives', () => {
		const result = OneVersusOneCombatRuleset.create(primitives(OneVersusOneCombatRuleset.CONSTRAINTS), [
			...ATTRIBUTE_DEFINITIONS,
		]);

		expect(result.isRight()).toBe(true);

		const ruleset = result.getRight();
		expect(ruleset).toBeInstanceOf(OneVersusOneCombatRuleset);
		expect(ruleset.groupConstraints).toEqual(OneVersusOneCombatRuleset.CONSTRAINTS);
	});

	it('rejects mismatched composition constraints', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives({
				...OneVersusOneCombatRuleset.CONSTRAINTS,
				maxCombatantsPerGroup: 3,
			}),
			[]
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		expect(result.getLeft()[0]?.path).toBe('groupConstraints.maxCombatantsPerGroup');
	});

	it('accepts exactly two groups with one combatant each', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.CONSTRAINTS),
			[]
		).getRight();

		expect(ruleset.validateGroups([group('alpha', 1), group('beta', 1)]).isRight()).toBe(true);
	});

	it('rejects a group with more than one combatant', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.CONSTRAINTS),
			[]
		).getRight();

		const result = ruleset.validateGroups([group('alpha', 2), group('beta', 1)]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
		expect(result.getLeft()[0]?.message).toContain('at most 1 combatant(s)');
	});

	it('round-trips primitives', () => {
		const source = primitives(OneVersusOneCombatRuleset.CONSTRAINTS);

		const result = OneVersusOneCombatRuleset.create(source, []);

		expect(result.getRight().toPrimitives()).toEqual(source);
	});
});

describe('TwoVersusTwoCombatRuleset', () => {
	it('declares its composition constraints', () => {
		expect(TwoVersusTwoCombatRuleset.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 2,
			maxGroups: 2,
			minCombatantsPerGroup: 2,
			minGroups: 2,
		});
	});

	it('hydrates a ruleset from primitives', () => {
		const result = TwoVersusTwoCombatRuleset.create(primitives(TwoVersusTwoCombatRuleset.CONSTRAINTS), []);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(TwoVersusTwoCombatRuleset);
	});

	it('rejects mismatched composition constraints', () => {
		const result = TwoVersusTwoCombatRuleset.create(
			primitives({
				...TwoVersusTwoCombatRuleset.CONSTRAINTS,
				maxCombatantsPerGroup: 3,
			}),
			[]
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		expect(result.getLeft()[0]?.path).toBe('groupConstraints.maxCombatantsPerGroup');
	});

	it('accepts exactly two groups with two combatants each', () => {
		const ruleset = TwoVersusTwoCombatRuleset.create(
			primitives(TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[]
		).getRight();

		expect(ruleset.validateGroups([group('alpha', 2), group('beta', 2)]).isRight()).toBe(true);
	});

	it('rejects a group with fewer than two combatants', () => {
		const ruleset = TwoVersusTwoCombatRuleset.create(
			primitives(TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[]
		).getRight();

		const result = ruleset.validateGroups([group('alpha', 1), group('beta', 2)]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
		expect(result.getLeft()[0]?.message).toContain('at least 2 combatant(s)');
	});

	it('round-trips primitives', () => {
		const source = primitives(TwoVersusTwoCombatRuleset.CONSTRAINTS);

		const result = TwoVersusTwoCombatRuleset.create(source, []);

		expect(result.getRight().toPrimitives()).toEqual(source);
	});
});
