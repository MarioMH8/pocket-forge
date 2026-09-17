import { AttributeDefinitionMother } from '@pocket-forge/attributes/mother/domain';
import { Creature } from '@pocket-forge/creature/domain';
import { CreatureMother } from '@pocket-forge/creature/mother/domain';
import { SpeciesMother } from '@pocket-forge/species/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('Creature', () => {
	describe('create', () => {
		it('creates a creature with valid attributes', () => {
			const definition = AttributeDefinitionMother.create();
			const species = SpeciesMother.primitives();
			const creature = Creature.create('creature-1', 'Sparky', species, [], [], [], [definition]);

			expect(creature.id).toBe('creature-1');
			expect(creature.name).toBe('Sparky');
			expect(creature.species).toEqual(species);
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const species = SpeciesMother.primitives();
			expect(() => Creature.create('', 'Name', species, [], [], [], [definition])).toThrow();
		});

		it('throws when name is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const species = SpeciesMother.primitives();
			expect(() => Creature.create('id', '', species, [], [], [], [definition])).toThrow();
		});

		it('throws when species is missing', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() =>
				Creature.create(
					'id',
					'Name',
					undefined as unknown as ReturnType<typeof SpeciesMother.primitives>,
					[],
					[],
					[],
					[definition]
				)
			).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = CreatureMother.primitives();
			const creature = Creature.fromPrimitives(primitives);

			expect(creature.toPrimitives()).toEqual(primitives);
		});
	});

	describe('getAttribute', () => {
		it('returns the attribute value when set', () => {
			const creature = CreatureMother.create({
				attributes: { level: 5 },
			});

			expect(creature.getAttribute('level')).toBe(5);
		});

		it('returns undefined for missing attribute', () => {
			const creature = CreatureMother.create();

			expect(creature.getAttribute('nonexistent')).toBeUndefined();
		});
	});
});
