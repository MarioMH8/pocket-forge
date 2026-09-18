import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { Creature } from '@pocket-forge/creature/domain';
import { CreatureMother } from '@pocket-forge/creature/mother/domain';
import { SpeciesMother } from '@pocket-forge/species/mother/domain';
import { describe, expect, it } from 'bun:test';

interface CreatureAttributes {
	hp: string[];
	life: boolean;
	name: string;
}

describe('Creature', () => {
	describe('create', () => {
		it('creates a creature with valid attributes', () => {
			const hpDefinition = AttributeDefinitionMother.array({ defaultValue: [], key: 'hp' });
			const lifeDefinition = AttributeDefinitionMother.boolean({ defaultValue: false, key: 'life' });
			const nameDefinition = AttributeDefinitionMother.string({ defaultValue: 'default', key: 'name' });
			const species = SpeciesMother.primitives();
			const creature = Creature.create<CreatureAttributes>(
				'creature-1',
				'Sparky',
				species,
				[],
				[],
				{ hp: ['fire', 'water'], life: true, name: 'Sparky' },
				[hpDefinition, lifeDefinition, nameDefinition]
			);

			expect(creature.id).toBe('creature-1');
			expect(creature.name).toBe('Sparky');
			expect(creature.species).toEqual(species);
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const species = SpeciesMother.primitives();
			expect(() => Creature.create('', 'Name', species, [], [], {}, [definition])).toThrow();
		});

		it('throws when name is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const species = SpeciesMother.primitives();
			expect(() => Creature.create('id', '', species, [], [], {}, [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = CreatureMother.primitives();
			const creature = Creature.fromPrimitives(primitives);

			expect(creature.toPrimitives()).toEqual(primitives);
		});
	});

	describe('attributes', () => {
		it('returns the attribute value when set', () => {
			const creature = CreatureMother.create({
				attributes: { level: 5 },
			});

			expect(creature.attributes.value['level']).toBe(5);
		});

		it('returns undefined for missing attribute', () => {
			const creature = CreatureMother.create();

			expect(creature.attributes.value['nonexistent']).toBeUndefined();
		});
	});
});
