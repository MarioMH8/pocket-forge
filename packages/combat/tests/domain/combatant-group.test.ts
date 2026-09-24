import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { CombatantGroup } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother } from '@pocket-forge/combat/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('CombatantGroup', () => {
	describe('create', () => {
		it('creates a group with combatants and validated attributes', () => {
			const bonusHpDefinition = AttributeDefinitionMother.number({ key: 'bonusHp' });
			const combatant = CombatantMother.create({ groupId: 'group-1' });
			const group = CombatantGroup.create('group-1', 'Alpha Squad', [combatant], { bonusHp: 10 }, [
				bonusHpDefinition,
			]);

			expect(group.id).toBe('group-1');
			expect(group.name).toBe('Alpha Squad');
			expect(group.combatants).toHaveLength(1);
			expect(group.combatants[0]?.id).toBe(combatant.id);
			expect(group.attributes.value.bonusHp).toBe(10);
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const combatant = CombatantMother.create();
			expect(() => CombatantGroup.create('', 'Name', [combatant], {}, [definition])).toThrow();
		});

		it('throws when name is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const combatant = CombatantMother.create();
			expect(() => CombatantGroup.create('id', '', [combatant], {}, [definition])).toThrow();
		});

		it('throws when combatants is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => CombatantGroup.create('id', 'Name', [], {}, [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = CombatantGroupMother.primitives();
			const group = CombatantGroup.fromPrimitives(primitives);

			expect(group.toPrimitives()).toEqual(primitives);
		});
	});
});
