import { AttributeMap } from '@pocket-forge/attribute/domain';
import { AttributeAssignmentMother, AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('AttributeMap', () => {
	describe('validateAndBuildAttributeMap', () => {
		it('builds a map from assignments and definitions', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			const map = AttributeMap.validateAndBuildAttributeMap([assignment], [definition], 'Test');

			expect(map.get('name')?.value).toBe('hello');
		});

		it('throws when assignment has no matching definition', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			expect(() => AttributeMap.validateAndBuildAttributeMap([assignment], [], 'Test')).toThrow();
		});
	});

	describe('hydrateAttributeMap', () => {
		it('hydrates from a plain record', () => {
			const map = AttributeMap.fromPrimitives({ level: 5, name: 'hello' });

			expect(map.get('name')?.value).toBe('hello');
			expect(map.get('level')?.value).toBe(5);
		});
	});

	describe('serializeAttributeMap', () => {
		it('serializes to a plain record', () => {
			const map = AttributeMap.fromPrimitives({ level: 5, name: 'hello' });
			const record = AttributeMap.toPrimitives(map);

			expect(record).toEqual({ level: 5, name: 'hello' });
		});
	});
});
