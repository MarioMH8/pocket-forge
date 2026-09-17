import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

import AbilityMother from '../../mother/domain/ability.mother';
import Ability from '../../src/domain/ability';

describe('Ability', () => {
	describe('create', () => {
		it('creates an ability with valid attributes', () => {
			const definition = AttributeDefinitionMother.create();
			const ability = Ability.create('ability-1', 'Flame Body', 'Burns on contact', [], [definition]);

			expect(ability.id).toBe('ability-1');
			expect(ability.name).toBe('Flame Body');
			expect(ability.description).toBe('Burns on contact');
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => Ability.create('', 'Name', 'Desc', [], [definition])).toThrow();
		});

		it('throws when name is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => Ability.create('id', '', 'Desc', [], [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = AbilityMother.primitives();
			const ability = Ability.fromPrimitives(primitives);

			expect(ability.toPrimitives()).toEqual(primitives);
		});
	});

	describe('getAttribute', () => {
		it('returns the attribute value when set', () => {
			const ability = AbilityMother.create({
				attributes: { speed: 10 },
			});

			expect(ability.getAttribute('speed')).toBe(10);
		});

		it('returns undefined for missing attribute', () => {
			const ability = AbilityMother.create();

			expect(ability.getAttribute('nonexistent')).toBeUndefined();
		});
	});
});
