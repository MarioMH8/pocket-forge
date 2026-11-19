import Either from '@hexadrop/either';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { CombatantGroup as CombatantGroupType } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import type { CombatRulesetData, CombatRulesetPrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatRuleset, CombatRulesetError } from '@pocket-forge/combat-engine/domain';
import { CombatRulesetMother, TEST_GROUP_CONSTRAINTS } from '@pocket-forge/combat-engine/mother/domain';
import { describe, expect, it } from 'bun:test';

const CONTRACT = {
	groupConstraints: TEST_GROUP_CONSTRAINTS,
};

class TestCombatRuleset extends CombatRuleset {
	protected constructor(data: CombatRulesetData) {
		super(data);
	}

	static create(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[]
	): Either<CombatRulesetError[], TestCombatRuleset> {
		return this.validate(primitives, definitions, CONTRACT).mapRight(data => new TestCombatRuleset(data));
	}
}

class AlphaOnlyRuleset extends TestCombatRuleset {
	private constructor(data: CombatRulesetData) {
		super(data);
	}

	static override create(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[]
	): Either<CombatRulesetError[], AlphaOnlyRuleset> {
		return this.validate(primitives, definitions, CONTRACT).mapRight(data => new AlphaOnlyRuleset(data));
	}

	override validateGroups(groups: readonly CombatantGroupType[]): Either<CombatRulesetError[], void> {
		const result = super.validateGroups(groups);

		if (result.isLeft()) {
			return result;
		}

		const errors = groups
			.filter(group => !group.id.startsWith('alpha'))
			.map(
				group =>
					new CombatRulesetError(
						'invalid-constraints',
						`Group "${group.id}" must start with "alpha"`,
						'groups'
					)
			);

		return errors.length > 0 ? Either.left(errors) : Either.right();
	}
}

function primitives(overrides?: Partial<CombatRulesetPrimitives>): CombatRulesetPrimitives {
	return CombatRulesetMother.primitives(overrides);
}

function create(
	overrides?: Partial<CombatRulesetPrimitives>,
	definitions: AttributeDefinition[] = []
): Either<CombatRulesetError[], TestCombatRuleset> {
	return TestCombatRuleset.create(primitives(overrides), definitions);
}

function group(id: string, combatants: number): CombatantGroupType {
	return CombatantGroupMother.create({
		combatants: Array.from({ length: combatants }, (_, index) =>
			CombatantMother.primitives({ groupId: id, id: `${id}-combatant-${String(index)}` })
		),
		id,
	});
}

describe('CombatRuleset', () => {
	describe('create', () => {
		it('stores attributes, definitions, and constraints', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 10, min: 1 },
				defaultValue: 5,
				key: 'bonusHp',
			});

			const result = create({ attributes: { bonusHp: 7 } }, [definition]);

			expect(result.isRight()).toBe(true);

			const ruleset = result.getRight();
			expect(ruleset.groupConstraints).toEqual(TEST_GROUP_CONSTRAINTS);
			expect(ruleset.attributes.value['bonusHp']).toBe(7);
			expect(ruleset.definitions).toEqual([definition]);
		});

		it('rejects hydration when a constraint differs from the concrete implementation', () => {
			const result = create({ groupConstraints: { ...TEST_GROUP_CONSTRAINTS, maxGroups: 9 } });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
			expect(result.getLeft()[0]?.path).toBe('groupConstraints.maxGroups');
		});

		it('rejects every group constraint that differs from the concrete implementation', () => {
			const result = create({
				groupConstraints: {
					...TEST_GROUP_CONSTRAINTS,
					maxCombatantsPerGroup: 9,
					maxGroups: 9,
					minCombatantsPerGroup: 9,
					minGroups: 9,
				},
			});

			expect(result.isLeft()).toBe(true);

			const paths = result.getLeft().map(error => error.path);
			expect(paths).toEqual([
				'groupConstraints.maxCombatantsPerGroup',
				'groupConstraints.maxGroups',
				'groupConstraints.minCombatantsPerGroup',
				'groupConstraints.minGroups',
			]);
		});

		it('rejects non-integer constraints', () => {
			const result = create({
				groupConstraints: { ...TEST_GROUP_CONSTRAINTS, minGroups: 1.5 },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().some(error => error.message.includes('must be an integer'))).toBe(true);
		});

		it('rejects constraints below one', () => {
			const result = create({
				groupConstraints: {
					...TEST_GROUP_CONSTRAINTS,
					minCombatantsPerGroup: 0,
					minGroups: 0,
				},
			});

			expect(result.isLeft()).toBe(true);

			const messages = result.getLeft().map(error => error.message);
			expect(messages).toContain('minGroups must be at least 1, received 0');
			expect(messages).toContain('minCombatantsPerGroup must be at least 1, received 0');
		});

		it('rejects inverted constraints', () => {
			const result = create({
				groupConstraints: {
					...TEST_GROUP_CONSTRAINTS,
					maxCombatantsPerGroup: 1,
					maxGroups: 1,
				},
			});

			expect(result.isLeft()).toBe(true);

			const messages = result.getLeft().map(error => error.message);
			expect(messages).toContain('minGroups 2 cannot exceed maxGroups 1');
			expect(messages).toContain('minCombatantsPerGroup 2 cannot exceed maxCombatantsPerGroup 1');
		});
	});

	describe('attributes', () => {
		it('rejects a value without a definition', () => {
			const result = create({ attributes: { unknown: true } });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.unknown');
		});

		it('rejects a missing required attribute without a default', () => {
			const definition = AttributeDefinition.create({
				constraints: { maxLength: 50, minLength: 1 },
				key: 'format',
				required: true,
				type: 'string',
			});

			const result = create({}, [definition]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.format');
			expect(result.getLeft()[0]?.message).toContain('is required');
		});

		it('rejects a value that fails its definition', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 10, min: 1 },
				defaultValue: 5,
				key: 'bonusHp',
			});

			const result = create({ attributes: { bonusHp: 99 } }, [definition]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.bonusHp');
			expect(result.getLeft()[0]?.message).toContain('exceeds maximum 10');
		});

		it('applies definition defaults', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 10, min: 1 },
				defaultValue: 5,
				key: 'bonusHp',
				required: true,
			});

			const result = create({}, [definition]);

			expect(result.isRight()).toBe(true);
			expect(result.getRight().attributes.value['bonusHp']).toBe(5);
		});

		it('skips optional attributes without a value', () => {
			const definition = AttributeDefinition.create({
				constraints: { max: 10, min: 1 },
				defaultValue: 5,
				key: 'bonusHp',
				type: 'number',
			});

			const result = create({}, [definition]);

			expect(result.isRight()).toBe(true);
			expect(result.getRight().attributes.toPrimitives()).toEqual({});
		});

		it('aggregates attribute failures', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 10, min: 1 },
				defaultValue: 5,
				key: 'bonusHp',
				required: true,
			});

			const result = create({ attributes: { bonusHp: 99, extra: 'nope' } }, [definition]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.path)).toEqual(['attributes.extra', 'attributes.bonusHp']);
		});
	});

	describe('validateGroups', () => {
		it('accepts groups within the declared constraints', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([group('alpha', 2), group('beta', 3)]);

			expect(result.isRight()).toBe(true);
		});

		it('rejects fewer groups than the minimum', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([group('alpha', 2)]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
			expect(result.getLeft()[0]?.path).toBe('groups');
			expect(result.getLeft()[0]?.message).toContain('at least 2 group(s)');
		});

		it('rejects more groups than the maximum', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([
				group('alpha', 2),
				group('beta', 2),
				group('gamma', 2),
				group('delta', 2),
			]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.path).toBe('groups');
			expect(result.getLeft()[0]?.message).toContain('at most 3 group(s)');
		});

		it('rejects a group with fewer combatants than the minimum', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([group('alpha', 2), group('beta', 1)]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.path).toBe('groups.1.combatants');
			expect(result.getLeft()[0]?.message).toContain('at least 2 combatant(s)');
		});

		it('rejects a group with more combatants than the maximum', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([group('alpha', 4), group('beta', 2)]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.path).toBe('groups.0.combatants');
			expect(result.getLeft()[0]?.message).toContain('at most 3 combatant(s)');
		});

		it('aggregates every violated constraint', () => {
			const ruleset = create().getRight();

			const result = ruleset.validateGroups([group('alpha', 1)]);

			expect(result.getLeft()).toHaveLength(2);
		});

		it('can be overridden by a concrete ruleset', () => {
			const ruleset = AlphaOnlyRuleset.create(primitives(), []).getRight();

			const valid = ruleset.validateGroups([group('alpha-1', 2), group('alpha-2', 2)]);
			const invalid = ruleset.validateGroups([group('alpha-1', 2), group('beta-2', 2)]);

			expect(valid.isRight()).toBe(true);
			expect(invalid.isLeft()).toBe(true);
			expect(invalid.getLeft()[0]?.message).toContain('must start with "alpha"');
		});
	});

	describe('toPrimitives', () => {
		it('round-trips', () => {
			const source = primitives();

			const result = TestCombatRuleset.create(source, []);

			expect(result.getRight().toPrimitives()).toEqual(source);
		});
	});
});
