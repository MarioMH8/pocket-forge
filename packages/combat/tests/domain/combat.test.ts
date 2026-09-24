import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { Combat } from '@pocket-forge/combat/domain';
import { CombatantGroupMother, CombatantMother, CombatMother } from '@pocket-forge/combat/mother/domain';
import { RandomPocketMother } from '@pocket-forge/rng/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('Combat', () => {
	describe('create', () => {
		it('creates an active combat with at least one group', () => {
			const definition = AttributeDefinitionMother.create();
			const groups = [CombatantGroupMother.create()];
			const rng = RandomPocketMother.create();

			const combat = Combat.create('combat-1', groups, {}, [definition], rng);

			expect(combat.id).toBe('combat-1');
			expect(combat.status).toBe('active');
			expect(combat.groups).toHaveLength(1);
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const rng = RandomPocketMother.create();
			expect(() => Combat.create('', [CombatantGroupMother.create()], {}, [definition], rng)).toThrow();
		});

		it('throws when groups is empty', () => {
			const definition = AttributeDefinitionMother.create();
			const rng = RandomPocketMother.create();
			expect(() => Combat.create('combat-1', [], {}, [definition], rng)).toThrow();
		});

		it('throws when combatant ids are not unique across groups', () => {
			const definition = AttributeDefinitionMother.create();
			const rng = RandomPocketMother.create();
			const combatant = CombatantMother.create();
			const group1 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ id: combatant.id })],
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ id: combatant.id })],
			});

			expect(() => Combat.create('combat-1', [group1, group2], {}, [definition], rng)).toThrow(
				/Duplicated combatant id/
			);
		});
	});

	describe('apply', () => {
		it('produces a new immutable Combat snapshot', () => {
			const combat = CombatMother.create();
			const newRng = RandomPocketMother.create();
			const newGroup = CombatantGroupMother.create({
				name: 'New Squad',
			});

			const next = combat.apply({
				groups: [newGroup],
				randomPocket: newRng,
				status: 'active',
			});

			expect(next).not.toBe(combat);
			expect(next.id).toBe(combat.id);
			expect(next.groups[0]?.name).toBe('New Squad');
			expect(next.randomPocket).toBe(newRng);
		});

		it('transitions to completed status', () => {
			const combat = CombatMother.create();
			const rng = RandomPocketMother.create();
			const group = CombatantGroupMother.create();

			const next = combat.apply({
				groups: [group],
				randomPocket: rng,
				status: 'completed',
			});

			expect(next.status).toBe('completed');
		});

		it('throws when combat is already completed', () => {
			const combat = CombatMother.create({ status: 'completed' });
			const rng = RandomPocketMother.create();

			expect(() =>
				combat.apply({
					groups: [CombatantGroupMother.create()],
					randomPocket: rng,
					status: 'completed',
				})
			).toThrow(/Cannot apply transition to completed combat/);
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = CombatMother.primitives();
			const combat = Combat.fromPrimitives(primitives);

			expect(combat.toPrimitives()).toEqual(primitives);
		});
	});

	describe('RandomPocket', () => {
		it('stores the random pcket state', () => {
			const rng = RandomPocketMother.create();
			const combat = CombatMother.create({
				randomPocket: rng.toPrimitives(),
			});

			expect(combat.randomPocket.seed).toBe(rng.seed);
		});

		it('includes randomPocket in toPrimitives', () => {
			const combat = CombatMother.create();

			const primitives = combat.toPrimitives();
			expect(primitives.randomPocket).toHaveProperty('seed');
			expect(primitives.randomPocket).toHaveProperty('state');
		});
	});
});
