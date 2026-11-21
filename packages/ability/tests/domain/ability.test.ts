import { Ability } from '@pocket-forge/ability/domain';
import { AbilityMother } from '@pocket-forge/ability/mother/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('Ability', () => {
	describe('create', () => {
		it('creates an ability with valid attributes', () => {
			const definition = AttributeDefinitionMother.create();
			const ability = Ability.create('ability-1', {}, [definition]);

			expect(ability.id).toBe('ability-1');
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => Ability.create('', {}, [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = AbilityMother.primitives();
			const ability = Ability.fromPrimitives(primitives);

			expect(ability.toPrimitives()).toEqual(primitives);
		});
	});

	describe('attributes', () => {
		it('returns the attribute value when set', () => {
			const ability = AbilityMother.create({
				attributes: { speed: 10 },
			});

			expect(ability.attributes.value['speed']).toBe(10);
		});

		it('returns undefined for missing attribute', () => {
			const ability = AbilityMother.create();

			expect(ability.attributes.value['nonexistent']).toBeUndefined();
		});
	});
});
