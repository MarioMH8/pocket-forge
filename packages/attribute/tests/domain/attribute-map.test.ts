import { AttributeMap } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('AttributeMap', () => {
	describe('create', () => {
		it('builds a typed map from values and definitions', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });

			const map = AttributeMap.create({ name: 'hello' }, [definition], 'Test');

			expect(map.value.name).toBe('hello');
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
