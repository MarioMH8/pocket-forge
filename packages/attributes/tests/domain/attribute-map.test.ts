import {
	hydrateAttributeMap,
	serializeAttributeMap,
	validateAndBuildAttributeMap,
} from '@pocket-forge/attributes/domain';
import { AttributeAssignmentMother, AttributeDefinitionMother } from '@pocket-forge/attributes/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('attribute-map', () => {
	describe('validateAndBuildAttributeMap', () => {
		it('builds a map from assignments and definitions', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			const map = validateAndBuildAttributeMap([assignment], [definition], 'Test');

			expect(map.get('name')?.value).toBe('hello');
		});

		it('throws when assignment has no matching definition', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			expect(() => validateAndBuildAttributeMap([assignment], [], 'Test')).toThrow();
		});
	});

	describe('hydrateAttributeMap', () => {
		it('hydrates from a plain record', () => {
			const map = hydrateAttributeMap({ level: 5, name: 'hello' });

			expect(map.get('name')?.value).toBe('hello');
			expect(map.get('level')?.value).toBe(5);
		});
	});

	describe('serializeAttributeMap', () => {
		it('serializes to a plain record', () => {
			const map = hydrateAttributeMap({ level: 5, name: 'hello' });
			const record = serializeAttributeMap(map);

			expect(record).toEqual({ level: 5, name: 'hello' });
		});
	});
});
