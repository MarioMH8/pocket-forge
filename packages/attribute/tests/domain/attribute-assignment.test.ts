import { AttributeAssignment } from '@pocket-forge/attribute/domain';
import { AttributeAssignmentMother, AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('AttributeAssignment', () => {
	describe('create', () => {
		it('creates a validated assignment', () => {
			const definition = AttributeDefinitionMother.string();
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			expect(assignment.key).toBe('name');
			expect(assignment.value).toBe('hello');
		});

		it('throws when value does not match definition', () => {
			const definition = AttributeDefinitionMother.number();

			expect(() => AttributeAssignment.create({ key: 'power', value: 'not-a-number' }, definition)).toThrow();
		});

		it('throws when key does not match definition key', () => {
			const definition = AttributeDefinitionMother.string({ key: 'name' });

			expect(() => AttributeAssignment.create({ key: 'wrong-key', value: 'hello' }, definition)).toThrow();
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates without re-validating', () => {
			const assignment = AttributeAssignmentMother.fromPrimitives({ key: 'test', value: 42 });

			expect(assignment.key).toBe('test');
			expect(assignment.value).toBe(42);
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object', () => {
			const definition = AttributeDefinitionMother.string();
			const assignment = AttributeAssignmentMother.create(definition, { key: 'name', value: 'hello' });

			const primitives = assignment.toPrimitives();

			expect(primitives).toEqual({ key: 'name', value: 'hello' });
		});
	});
});
