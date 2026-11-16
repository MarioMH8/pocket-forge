import type { CombatantGroup, CombatGroupConstraints, CombatRulesetPrimitives } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother, CombatRulesetMother } from '@pocket-forge/combat/mother/domain';
import {
	OneVersusOneCombatRuleset,
	ReferenceCombatRulesetFactory,
	TwoVersusTwoCombatRuleset,
} from '@pocket-forge/combat-reference/domain';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS, VERSION_VALIDATOR } from '../support/reference.fixtures';

function primitives(
	kind: string,
	groupConstraints: CombatGroupConstraints,
	overrides?: Partial<CombatRulesetPrimitives>
): CombatRulesetPrimitives {
	return CombatRulesetMother.primitives({
		contractVersion: '1.0.0',
		groupConstraints: { ...groupConstraints },
		id: 'reference-ruleset',
		kind,
		name: 'Reference Ruleset',
		...overrides,
	});
}

function group(id: string, combatants: number): CombatantGroup {
	return CombatantGroupMother.create({
		combatants: Array.from({ length: combatants }, (_, index) =>
			CombatantMother.primitives({ groupId: id, id: `${id}-combatant-${String(index)}` })
		),
		id,
		name: `Group ${id}`,
	});
}

describe('OneVersusOneCombatRuleset', () => {
	it('declares its kind, version, and composition constraints', () => {
		expect(OneVersusOneCombatRuleset.KIND).toBe('1v1');
		expect(OneVersusOneCombatRuleset.VERSION).toBe('1.0.0');
		expect(OneVersusOneCombatRuleset.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 1,
			maxGroups: 2,
			minCombatantsPerGroup: 1,
			minGroups: 2,
		});
	});

	it('hydrates a ruleset from primitives', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS),
			[...ATTRIBUTE_DEFINITIONS],
			VERSION_VALIDATOR
		);

		expect(result.isRight()).toBe(true);

		const ruleset = result.getRight();
		expect(ruleset).toBeInstanceOf(OneVersusOneCombatRuleset);
		expect(ruleset.kind).toBe('1v1');
		expect(ruleset.contractVersion).toBe('1.0.0');
		expect(ruleset.groupConstraints).toEqual(OneVersusOneCombatRuleset.CONSTRAINTS);
	});

	it('rejects a mismatched kind', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives('2v2', OneVersusOneCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-kind');
		expect(result.getLeft()[0]?.path).toBe('kind');
	});

	it('rejects a mismatched contract version', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS, {
				contractVersion: '2.0.0',
			}),
			[],
			VERSION_VALIDATOR
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-version');
		expect(result.getLeft()[0]?.path).toBe('contractVersion');
	});

	it('rejects an invalid contract version scheme', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS, {
				contractVersion: '1.0',
			}),
			[],
			VERSION_VALIDATOR
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-version');
	});

	it('rejects mismatched composition constraints', () => {
		const result = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, {
				...OneVersusOneCombatRuleset.CONSTRAINTS,
				maxCombatantsPerGroup: 3,
			}),
			[],
			VERSION_VALIDATOR
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		expect(result.getLeft()[0]?.path).toBe('groupConstraints.maxCombatantsPerGroup');
	});

	it('accepts exactly two groups with one combatant each', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		).getRight();

		expect(ruleset.validateGroups([group('alpha', 1), group('beta', 1)]).isRight()).toBe(true);
	});

	it('rejects a group with more than one combatant', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		).getRight();

		const result = ruleset.validateGroups([group('alpha', 2), group('beta', 1)]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
		expect(result.getLeft()[0]?.message).toContain('at most 1 combatant(s)');
	});

	it('round-trips primitives', () => {
		const source = primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS);

		const result = OneVersusOneCombatRuleset.create(source, [], VERSION_VALIDATOR);

		expect(result.getRight().toPrimitives()).toEqual(source);
	});
});

describe('TwoVersusTwoCombatRuleset', () => {
	it('declares its kind, version, and composition constraints', () => {
		expect(TwoVersusTwoCombatRuleset.KIND).toBe('2v2');
		expect(TwoVersusTwoCombatRuleset.VERSION).toBe('1.0.0');
		expect(TwoVersusTwoCombatRuleset.CONSTRAINTS).toEqual({
			maxCombatantsPerGroup: 2,
			maxGroups: 2,
			minCombatantsPerGroup: 2,
			minGroups: 2,
		});
	});

	it('hydrates a ruleset from primitives', () => {
		const result = TwoVersusTwoCombatRuleset.create(
			primitives(TwoVersusTwoCombatRuleset.KIND, TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(TwoVersusTwoCombatRuleset);
	});

	it('rejects a mismatched kind', () => {
		const result = TwoVersusTwoCombatRuleset.create(
			primitives('1v1', TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		);

		expect(result.getLeft()[0]?.reason).toBe('invalid-kind');
	});

	it('accepts exactly two groups with two combatants each', () => {
		const ruleset = TwoVersusTwoCombatRuleset.create(
			primitives(TwoVersusTwoCombatRuleset.KIND, TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		).getRight();

		expect(ruleset.validateGroups([group('alpha', 2), group('beta', 2)]).isRight()).toBe(true);
	});

	it('rejects a group with fewer than two combatants', () => {
		const ruleset = TwoVersusTwoCombatRuleset.create(
			primitives(TwoVersusTwoCombatRuleset.KIND, TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[],
			VERSION_VALIDATOR
		).getRight();

		const result = ruleset.validateGroups([group('alpha', 1), group('beta', 2)]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
		expect(result.getLeft()[0]?.message).toContain('at least 2 combatant(s)');
	});
});

describe('ReferenceCombatRulesetFactory', () => {
	const factory = new ReferenceCombatRulesetFactory(VERSION_VALIDATOR);

	it('hydrates a 1v1 ruleset by kind', () => {
		const result = factory.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS),
			[]
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(OneVersusOneCombatRuleset);
	});

	it('hydrates a 2v2 ruleset by kind', () => {
		const result = factory.create(
			primitives(TwoVersusTwoCombatRuleset.KIND, TwoVersusTwoCombatRuleset.CONSTRAINTS),
			[]
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(TwoVersusTwoCombatRuleset);
	});

	it('rejects an unknown kind', () => {
		const result = factory.create(primitives('3v3', OneVersusOneCombatRuleset.CONSTRAINTS), []);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-kind');
		expect(result.getLeft()[0]?.path).toBe('kind');
		expect(result.getLeft()[0]?.message).toContain('3v3');
	});

	it('verifies the serialized contract through the concrete ruleset', () => {
		const result = factory.create(
			primitives(OneVersusOneCombatRuleset.KIND, OneVersusOneCombatRuleset.CONSTRAINTS, {
				contractVersion: '0.9.0',
			}),
			[]
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-version');
	});
});
