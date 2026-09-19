import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('AttributeDefinition', () => {
	describe('create', () => {
		it('creates a string attribute definition', () => {
			const definition = AttributeDefinitionMother.string();

			expect(definition.key).toBe('name');
			expect(definition.type).toBe('string');
			expect(definition.defaultValue).toBe('default');
		});

		it('creates a number attribute definition', () => {
			const definition = AttributeDefinitionMother.number();

			expect(definition.key).toBe('power');
			expect(definition.type).toBe('number');
			expect(definition.defaultValue).toBe(0);
		});

		it('creates a boolean attribute definition', () => {
			const definition = AttributeDefinitionMother.boolean();

			expect(definition.key).toBe('isActive');
			expect(definition.type).toBe('boolean');
			expect(definition.defaultValue).toBe(false);
		});

		it('creates an enum attribute definition', () => {
			const definition = AttributeDefinitionMother.enum();

			expect(definition.key).toBe('element');
			expect(definition.type).toBe('enum');
			expect(definition.defaultValue).toBe('fire');
		});

		it('creates an array attribute definition', () => {
			const definition = AttributeDefinitionMother.array();

			expect(definition.key).toBe('tags');
			expect(definition.type).toBe('array');
			expect(definition.defaultValue).toEqual([]);
		});

		it('throws when key is empty', () => {
			expect(() => AttributeDefinitionMother.create({ key: '' })).toThrow();
		});

		it('throws when type is invalid', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: 'hello',
					key: 'test',
					type: 'invalid' as never,
				})
			).toThrow();
		});

		it('throws when default value does not match type', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: 'not-a-number',
					key: 'test',
					type: 'number',
				})
			).toThrow();
		});

		it('skips default validation for optional attributes (no defaultValue)', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: undefined,
					key: 'test',
					type: 'number',
				})
			).not.toThrow();
		});

		it('throws when enum has no validValues', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: 'a',
					key: 'test',
					type: 'enum',
				})
			).toThrow();
		});

		it('throws when array has no itemType', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: [],
					key: 'test',
					type: 'array',
				})
			).toThrow();
		});
	});

	describe('validateValue', () => {
		it('returns undefined for a valid string', () => {
			const definition = AttributeDefinitionMother.string();

			expect(definition.validateValue('hello')).toBeUndefined();
		});

		it('returns error for a non-string value', () => {
			const definition = AttributeDefinitionMother.string();

			expect(definition.validateValue(42)).toBeDefined();
		});

		it('returns error when string is too short', () => {
			const definition = AttributeDefinitionMother.string({ constraints: { minLength: 5 } });

			expect(definition.validateValue('hi')).toBeDefined();
		});

		it('returns error when string is too long', () => {
			const definition = AttributeDefinitionMother.string({ constraints: { maxLength: 3 }, defaultValue: 'hi' });

			expect(definition.validateValue('hello')).toBeDefined();
		});

		it('returns undefined for a valid number', () => {
			const definition = AttributeDefinitionMother.number();

			expect(definition.validateValue(50)).toBeUndefined();
		});

		it('returns error when number is below min', () => {
			const definition = AttributeDefinitionMother.number({ constraints: { min: 10 }, defaultValue: 50 });

			expect(definition.validateValue(5)).toBeDefined();
		});

		it('returns error when number exceeds max', () => {
			const definition = AttributeDefinitionMother.number({ constraints: { max: 100 } });

			expect(definition.validateValue(200)).toBeDefined();
		});

		it('returns undefined for a valid boolean', () => {
			const definition = AttributeDefinitionMother.boolean();

			expect(definition.validateValue(true)).toBeUndefined();
		});

		it('returns error for a non-boolean value', () => {
			const definition = AttributeDefinitionMother.boolean();

			expect(definition.validateValue('true')).toBeDefined();
		});

		it('returns undefined for a valid enum value', () => {
			const definition = AttributeDefinitionMother.enum();

			expect(definition.validateValue('fire')).toBeUndefined();
		});

		it('returns error for an invalid enum value', () => {
			const definition = AttributeDefinitionMother.enum();

			expect(definition.validateValue('shadow')).toBeDefined();
		});

		it('returns undefined for a valid array', () => {
			const definition = AttributeDefinitionMother.array();

			expect(definition.validateValue(['tag1', 'tag2'])).toBeUndefined();
		});

		it('returns error for a non-array value', () => {
			const definition = AttributeDefinitionMother.array();

			expect(definition.validateValue('not-an-array')).toBeDefined();
		});

		it('returns error when array item type is wrong', () => {
			const definition = AttributeDefinitionMother.array();

			expect(definition.validateValue([1, 2, 3])).toBeDefined();
		});

		it('returns error when array is too short', () => {
			const definition = AttributeDefinitionMother.array({
				constraints: { itemType: 'string', minLength: 2 },
				defaultValue: ['a', 'b'],
			});

			expect(definition.validateValue(['a'])).toBeDefined();
		});

		it('returns error when array is too long', () => {
			const definition = AttributeDefinitionMother.array({ constraints: { itemType: 'string', maxLength: 2 } });

			expect(definition.validateValue(['a', 'b', 'c'])).toBeDefined();
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates without re-validating', () => {
			const definition = AttributeDefinitionMother.fromPrimitives();

			expect(definition.key).toBeDefined();
			expect(definition.type).toBeDefined();
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object', () => {
			const definition = AttributeDefinitionMother.string();

			const primitives = definition.toPrimitives();

			expect(primitives.key).toBe('name');
			expect(primitives.type).toBe('string');
			expect(primitives.defaultValue).toBe('default');
		});

		it('includes constraints when present', () => {
			const definition = AttributeDefinitionMother.string({ constraints: { maxLength: 100, minLength: 1 } });

			const primitives = definition.toPrimitives();

			expect(primitives.constraints).toBeDefined();
			expect(primitives.constraints.minLength).toBe(1);
		});

		it('includes constraints even when empty', () => {
			const definition = AttributeDefinitionMother.boolean();

			const primitives = definition.toPrimitives();

			expect(primitives.constraints).toBeDefined();
			expect(primitives.constraints).toEqual({});
		});
	});
});
