import Either from '@hexadrop/either';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { CombatRuleData, CombatRulePrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatRule, CombatRuleError } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

class TestCombatRule extends CombatRule {
	protected constructor(data: CombatRuleData) {
		super(data);
	}

	static create(
		primitives: CombatRulePrimitives,
		definitions: readonly AttributeDefinition[]
	): Either<CombatRuleError[], TestCombatRule> {
		return this.validate(primitives, definitions).mapRight(data => new TestCombatRule(data));
	}
}

describe('CombatRule', () => {
	describe('create', () => {
		it('stores attributes and definitions', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 100, min: 0 },
				defaultValue: 10,
				key: 'power',
			});

			const result = TestCombatRule.create({ attributes: { power: 40 } }, [definition]);

			expect(result.isRight()).toBe(true);
			expect(result.getRight().attributes.toPrimitives()).toEqual({ power: 40 });
			expect(result.getRight().definitions).toEqual([definition]);
		});

		it('rejects unknown attributes', () => {
			const result = TestCombatRule.create({ attributes: { unknown: 1 } }, []);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.unknown');
		});

		it('rejects invalid attribute values', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 100, min: 0 },
				defaultValue: 10,
				key: 'power',
			});

			const result = TestCombatRule.create({ attributes: { power: 500 } }, [definition]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.power');
		});

		it('rejects missing required attributes', () => {
			const definition = AttributeDefinition.create({
				constraints: { max: 100, min: 0 },
				key: 'power',
				required: true,
				type: 'number',
			});

			const result = TestCombatRule.create({ attributes: {} }, [definition]);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
			expect(result.getLeft()[0]?.path).toBe('attributes.power');
		});
	});

	describe('toPrimitives', () => {
		it('round-trips', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { max: 100, min: 0 },
				defaultValue: 10,
				key: 'power',
			});

			const source = { attributes: { power: 40 } };
			const rule = TestCombatRule.create(source, [definition]).getRight();

			expect(rule.toPrimitives()).toEqual(source);
		});
	});
});
