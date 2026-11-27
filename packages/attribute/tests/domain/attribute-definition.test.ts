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
					required: true,
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
					required: true,
					type: 'number',
				})
			).toThrow();
		});

		it('skips default validation for optional attributes', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: 'not-a-number',
					key: 'test',
					required: false,
					type: 'number',
				})
			).toThrow();
		});

		it('throws when enum has no validValues', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: 'a',
					key: 'test',
					required: true,
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
					required: true,
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

	describe('record definitions', () => {
		it('creates a record definition with nested fields and an enum', () => {
			const definition = AttributeDefinition.create({
				constraints: {
					fields: [
						AttributeDefinitionMother.enum({ key: 'target' }),
						AttributeDefinitionMother.number({
							constraints: { max: 100, min: 1 },
							defaultValue: 100,
							key: 'chance',
						}),
						AttributeDefinitionMother.string({ key: 'status' }),
					],
				},
				defaultValue: { chance: 100, status: 'burn', target: 'fire' },
				key: 'secondary',
				required: true,
				type: 'record',
			});

			expect(definition.type).toBe('record');
			expect(definition.constraints.fields).toHaveLength(3);
			expect(definition.constraints.fields?.[0]).toBeInstanceOf(AttributeDefinition);
		});

		it('throws when a record definition has no fields', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					key: 'secondary',
					type: 'record',
				})
			).toThrow();
		});

		it('throws when a record definition has empty fields', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [] },
					key: 'secondary',
					type: 'record',
				})
			).toThrow();
		});

		it('throws when a non-record definition declares fields', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [AttributeDefinitionMother.string()] },
					key: 'name',
					type: 'string',
				})
			).toThrow();
		});

		it('throws when record fields have duplicated keys', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {
						fields: [
							AttributeDefinitionMother.string({ key: 'status' }),
							AttributeDefinitionMother.number({ key: 'status' }),
						],
					},
					key: 'secondary',
					type: 'record',
				})
			).toThrow();
		});

		it('throws when an array has neither itemType nor itemDefinition', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: {},
					defaultValue: [],
					key: 'tags',
					type: 'array',
				})
			).toThrow();
		});

		it('throws when an array has both itemType and itemDefinition', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: { itemDefinition: AttributeDefinitionMother.record(), itemType: 'string' },
					defaultValue: [],
					key: 'tags',
					type: 'array',
				})
			).toThrow();
		});

		it('throws when an array itemDefinition is not a record', () => {
			expect(() =>
				AttributeDefinition.create({
					constraints: { itemDefinition: AttributeDefinitionMother.number() },
					defaultValue: [],
					key: 'values',
					type: 'array',
				})
			).toThrow();
		});

		it('throws when a record default misses a required field without default', () => {
			const required = AttributeDefinition.create({
				constraints: {},
				key: 'status',
				required: true,
				type: 'string',
			});

			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [required] },
					defaultValue: {},
					key: 'secondary',
					type: 'record',
				})
			).toThrow();
		});

		it('throws when a record default has a wrong nested type', () => {
			const stages = AttributeDefinitionMother.number({ key: 'stages' });

			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [stages] },
					defaultValue: { stages: 'high' },
					key: 'boosts',
					type: 'record',
				})
			).toThrow();
		});

		it('throws when a record default has an out-of-range nested value', () => {
			const stages = AttributeDefinition.create({
				constraints: { max: 6, min: -6 },
				defaultValue: 0,
				key: 'stages',
				type: 'number',
			});

			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [stages] },
					defaultValue: { stages: 12 },
					key: 'boosts',
					type: 'record',
				})
			).toThrow();
		});

		it('accepts a record default that omits fields with their own default', () => {
			const status = AttributeDefinition.create({
				constraints: {},
				defaultValue: 'burn',
				key: 'status',
				required: true,
				type: 'string',
			});
			const chance = AttributeDefinitionMother.number({
				constraints: { max: 100, min: 1 },
				defaultValue: 100,
				key: 'chance',
			});

			expect(() =>
				AttributeDefinition.create({
					constraints: { fields: [status, chance] },
					defaultValue: { chance: 50 },
					key: 'secondary',
					type: 'record',
				})
			).not.toThrow();
		});
	});

	describe('record validation', () => {
		const attack = AttributeDefinition.create({
			constraints: { max: 6, min: -6 },
			key: 'attack',
			required: true,
			type: 'number',
		});
		const boosts = AttributeDefinition.create({
			constraints: { fields: [attack] },
			key: 'boosts',
			required: true,
			type: 'record',
		});
		const secondary = AttributeDefinition.create({
			constraints: { fields: [boosts] },
			key: 'secondary',
			required: true,
			type: 'record',
		});

		it('validates a nested record', () => {
			expect(secondary.validateValue({ boosts: { attack: 2 } })).toBeUndefined();
		});

		it('returns an error with a path when a required field is missing', () => {
			expect(secondary.validateValue({ boosts: {} })?.message).toBe(
				'Field "boosts.attack" is required but no value or default was provided'
			);
		});

		it('returns an error with a path for an unknown field', () => {
			expect(secondary.validateValue({ boosts: { attack: 1, defense: 1 } })?.message).toBe(
				'Field "boosts.defense" is not a declared field'
			);
		});

		it('returns an error with a path for a wrong nested type', () => {
			expect(secondary.validateValue({ boosts: { attack: 'high' } })?.message).toBe(
				'Field "boosts.attack": Expected number, got string'
			);
		});

		it('returns an error with a path for an out-of-range nested value', () => {
			expect(secondary.validateValue({ boosts: { attack: 12 } })?.message).toBe(
				'Field "boosts.attack": Value 12 exceeds maximum 6'
			);
		});

		it('rejects values that are not plain records', () => {
			expect(secondary.validateValue('strong')?.message).toBe('Expected record, got string');
			// eslint-disable-next-line unicorn/no-null -- null is a valid invalid input to exercise
			expect(secondary.validateValue(null)?.message).toBe('Expected record, got null');
			expect(secondary.validateValue([])?.message).toBe('Expected record, got array');
		});

		it('validates arrays of records with indexed paths', () => {
			const entry = AttributeDefinition.create({
				constraints: {
					fields: [
						AttributeDefinition.create({ constraints: {}, key: 'moveId', required: true, type: 'string' }),
						AttributeDefinition.create({
							constraints: { max: 64, min: 0 },
							defaultValue: 35,
							key: 'current',
							type: 'number',
						}),
						AttributeDefinition.create({
							constraints: { max: 64, min: 1 },
							defaultValue: 35,
							key: 'max',
							type: 'number',
						}),
					],
				},
				key: 'movePpEntry',
				type: 'record',
			});
			const movePp = AttributeDefinition.create({
				constraints: { itemDefinition: entry, maxLength: 4 },
				defaultValue: [],
				key: 'movePp',
				type: 'array',
			});

			expect(movePp.validateValue([{ current: 10, max: 35, moveId: 'ember' }])).toBeUndefined();
			expect(movePp.validateValue([{ moveId: 'ember' }, {}])?.message).toBe(
				'Field "1.moveId" is required but no value or default was provided'
			);
			expect(movePp.validateValue([{ moveId: 'ember' }, { current: 99, moveId: 'tackle' }])?.message).toBe(
				'Field "1.current": Value 99 exceeds maximum 64'
			);
			expect(movePp.validateValue([{ moveId: 'ember' }, 1])?.message).toBe(
				'Field "1": Expected record, got number'
			);
			expect(movePp.validateValue([{}, {}, {}, {}, {}])?.message).toBe('Array length 5 exceeds maximum 4');
		});
	});

	describe('serialization', () => {
		it('round-trips record definitions through primitives', () => {
			const definition = AttributeDefinitionMother.record();

			const primitives = definition.toPrimitives();
			const restored = AttributeDefinition.fromPrimitives(primitives);

			expect(restored.toPrimitives()).toEqual(primitives);
			expect(restored.constraints.fields?.[0]).toBeInstanceOf(AttributeDefinition);
			expect(primitives.constraints.fields?.[0]?.key).toBe('stages');
		});

		it('round-trips arrays of records through primitives', () => {
			const definition = AttributeDefinition.create({
				constraints: { itemDefinition: AttributeDefinitionMother.record({ key: 'entry' }) },
				defaultValue: [],
				key: 'movePp',
				type: 'array',
			});

			const primitives = definition.toPrimitives();
			const restored = AttributeDefinition.fromPrimitives(primitives);

			expect(restored.toPrimitives()).toEqual(primitives);
			expect(restored.constraints.itemDefinition).toBeInstanceOf(AttributeDefinition);
		});
	});

	describe('flat regression', () => {
		it('keeps root-level messages unchanged', () => {
			expect(AttributeDefinitionMother.number().validateValue('high')?.message).toBe(
				'Expected number, got string'
			);
			expect(AttributeDefinitionMother.array().validateValue('high')?.message).toBe('Expected array, got string');
			expect(AttributeDefinitionMother.enum().validateValue('shadow')?.message).toBe(
				'"shadow" is not a valid value for attribute "element". Allowed: fire, water, earth, air'
			);
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
