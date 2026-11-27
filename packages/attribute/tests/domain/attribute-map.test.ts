import type { AttributeValue } from '@pocket-forge/attribute/domain';
import { AttributeDefinition, AttributeMap } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('AttributeMap', () => {
	describe('create', () => {
		it('builds a typed map from values and definitions', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });

			const map = AttributeMap.create({ name: 'hello' }, [definition], 'Test');

			expect(map.value.name).toBe('hello');
		});

		it('applies default values for keys not provided', () => {
			const definition = AttributeDefinitionMother.string({
				defaultValue: 'fallback',
				key: 'label',
				required: true,
			});

			const map = AttributeMap.create({}, [definition], 'Test');

			expect((map.value as Record<string, string>)['label']).toBe('fallback');
		});

		it('overrides default with provided value', () => {
			const definition = AttributeDefinitionMother.string({ defaultValue: 'fallback', key: 'label' });

			const map = AttributeMap.create({ label: 'custom' }, [definition], 'Test');

			expect(map.value.label).toBe('custom');
		});

		it('throws when a value has no matching definition', () => {
			expect(() => AttributeMap.create({ name: 'hello' }, [], 'Test')).toThrow();
		});

		it('throws when a value fails validation', () => {
			const definition = AttributeDefinitionMother.number({
				constraints: { min: 1 },
				defaultValue: 10,
				key: 'hp',
			});

			expect(() => AttributeMap.create({ hp: 0 }, [definition], 'Test')).toThrow();
		});

		it('skips optional attributes when no value is provided', () => {
			const definition = AttributeDefinition.create({
				constraints: {},
				defaultValue: '',
				key: 'forme',
				required: false,
				type: 'string',
			});

			const map = AttributeMap.create({}, [definition], 'Test');

			expect((map.value as Record<string, AttributeValue>)['forme']).toBeUndefined();
		});

		it('includes optional attributes when a value is provided', () => {
			const definition = AttributeDefinition.create({
				constraints: {},
				defaultValue: '',
				key: 'forme',
				required: false,
				type: 'string',
			});

			const map = AttributeMap.create({ forme: 'Mega' }, [definition], 'Test');

			expect(map.value.forme).toBe('Mega');
		});
	});

	describe('record values', () => {
		const boostsDefinition = AttributeDefinition.create({
			constraints: {
				fields: [
					AttributeDefinition.create({
						constraints: { max: 6, min: -6 },
						defaultValue: 0,
						key: 'stages',
						type: 'number',
					}),
				],
			},
			key: 'boosts',
			type: 'record',
		});

		it('applies nested field defaults and keeps present values', () => {
			const map = AttributeMap.create({ boosts: { stages: 2 } }, [boostsDefinition], 'Test');

			expect(map.value.boosts).toEqual({ stages: 2 });

			const defaulted = AttributeMap.create({ boosts: {} }, [boostsDefinition], 'Test');

			expect(defaulted.value.boosts).toEqual({ stages: 0 });
		});

		it('does not mutate the input object', () => {
			const input = Object.freeze({ stages: 1 });

			const map = AttributeMap.create({ boosts: input }, [boostsDefinition], 'Test');

			expect(input).toEqual({ stages: 1 });
			expect(map.value.boosts).not.toBe(input);
		});

		it('rejects unknown nested fields', () => {
			expect(() => AttributeMap.create({ boosts: { defense: 1 } }, [boostsDefinition], 'Test')).toThrow(
				'Invalid value for attribute "boosts": Field "defense" is not a declared field'
			);
		});

		it('rejects nested values that fail their field definition', () => {
			expect(() => AttributeMap.create({ boosts: { stages: 12 } }, [boostsDefinition], 'Test')).toThrow(
				'Invalid value for attribute "boosts": Field "stages": Value 12 exceeds maximum 6'
			);
		});

		it('skips optional record attributes when no value is provided', () => {
			const map = AttributeMap.create({}, [boostsDefinition], 'Test');

			expect((map.value as Record<string, AttributeValue>)['boosts']).toBeUndefined();
		});

		it('applies defaults inside arrays of records', () => {
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
			const definition = AttributeDefinition.create({
				constraints: { itemDefinition: entry },
				key: 'movePp',
				type: 'array',
			});

			const map = AttributeMap.create({ movePp: [{ moveId: 'ember' }] }, [definition], 'Test');

			expect((map.value as Record<string, AttributeValue>)['movePp']).toEqual([
				{ current: 35, max: 35, moveId: 'ember' },
			]);
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates from a plain record', () => {
			const map = AttributeMap.fromPrimitives({ level: 5, name: 'hello' });

			expect(map.value['name']).toBe('hello');
			expect(map.value['level']).toBe(5);
		});
	});

	describe('toPrimitives', () => {
		it('serializes to a plain record', () => {
			const map = AttributeMap.fromPrimitives({ level: 5, name: 'hello' });
			const record = map.toPrimitives();

			expect(record).toEqual({ level: 5, name: 'hello' });
		});
	});
});
