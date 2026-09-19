import { Species } from '@pocket-forge/species/domain';
import { SpeciesMother } from '@pocket-forge/species/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('Species', () => {
	describe('create', () => {
		it('creates a species with validated attributes', () => {
			const species = SpeciesMother.create();

			expect(species.id).toBeDefined();
			expect(species.name).toBeDefined();
		});

		it('throws when id is empty', () => {
			expect(() => Species.create('', 'Name', {}, [])).toThrow();
		});

		it('throws when name is empty', () => {
			expect(() => Species.create('id', '', {}, [])).toThrow();
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates from primitives', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: { element: 'fire' },
				id: 'species-1',
				name: 'Dragon',
			});

			expect(species.id).toBe('species-1');
			expect(species.name).toBe('Dragon');
			expect(species.attributes.value['element']).toBe('fire');
		});
	});

	describe('attributes', () => {
		it('returns undefined for missing attribute', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: {},
				id: 'species-1',
				name: 'Dragon',
			});

			expect(species.attributes.value['nonexistent']).toBeUndefined();
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: { element: 'fire' },
				id: 'species-1',
				name: 'Dragon',
			});

			const primitives = species.toPrimitives();

			expect(primitives.id).toBe('species-1');
			expect(primitives.name).toBe('Dragon');
			expect(primitives.attributes).toEqual({ element: 'fire' });
		});
	});
});
