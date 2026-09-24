import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { Combatant } from '@pocket-forge/combat/domain';
import { CombatantMother } from '@pocket-forge/combat/mother/domain';
import { CreatureMother } from '@pocket-forge/creature/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('Combatant', () => {
	describe('create', () => {
		it('creates a combatant with valid attributes and a creature snapshot', () => {
			const currentHpDefinition = AttributeDefinitionMother.number({ key: 'currentHp' });
			const creature = CreatureMother.primitives();
			const combatant = Combatant.create('cbt-1', creature, 'group-a', { currentHp: 42 }, [currentHpDefinition]);

			expect(combatant.id).toBe('cbt-1');
			expect(combatant.creature).toEqual(creature);
			expect(combatant.groupId).toBe('group-a');
			expect(combatant.attributes.value.currentHp).toBe(42);
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const creature = CreatureMother.primitives();
			expect(() => Combatant.create('', creature, 'group-a', {}, [definition])).toThrow();
		});

		it('throws when groupId is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const creature = CreatureMother.primitives();
			expect(() => Combatant.create('cbt-1', creature, '', {}, [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = CombatantMother.primitives();
			const combatant = Combatant.fromPrimitives(primitives);

			expect(combatant.toPrimitives()).toEqual(primitives);
		});
	});

	describe('groupId', () => {
		it('stores the group the combatant belongs to', () => {
			const combatant = CombatantMother.create({ groupId: 'my-group' });

			expect(combatant.groupId).toBe('my-group');
		});
	});
});
