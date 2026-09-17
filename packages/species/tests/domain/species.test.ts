import { describe, expect, it } from 'bun:test';

import SpeciesMother from '../../mother/domain/species.mother';
import Species from '../../src/domain/species';

describe('Species', () => {
	describe('create', () => {
		it('creates a species with validated attributes', () => {
			const species = SpeciesMother.create();

			expect(species.id).toBeDefined();
			expect(species.name).toBeDefined();
			expect(species.description).toBeDefined();
		});

		it('throws when id is empty', () => {
			expect(() => Species.create('', 'Name', 'Desc', [], [])).toThrow();
		});

		it('throws when name is empty', () => {
			expect(() => Species.create('id', '', 'Desc', [], [])).toThrow();
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates from primitives', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: { element: 'fire' },
				description: 'A dragon',
				id: 'species-1',
				name: 'Dragon',
			});

			expect(species.id).toBe('species-1');
			expect(species.name).toBe('Dragon');
			expect(species.getAttribute('element')).toBe('fire');
		});
	});

	describe('getAttribute', () => {
		it('returns undefined for missing attribute', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: {},
				description: 'A dragon',
				id: 'species-1',
				name: 'Dragon',
			});

			expect(species.getAttribute('nonexistent')).toBeUndefined();
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object', () => {
			const species = SpeciesMother.fromPrimitives({
				attributes: { element: 'fire' },
				description: 'A dragon',
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
