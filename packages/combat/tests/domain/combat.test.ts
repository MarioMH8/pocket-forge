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
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: combatant.id })],
				id: 'group-1',
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-2', id: combatant.id })],
				id: 'group-2',
			});

			expect(() => Combat.create('combat-1', [group1, group2], {}, [definition], rng)).toThrow(
				/Duplicated combatant id/
			);
		});

		it('throws when group ids are not unique', () => {
			const definition = AttributeDefinitionMother.create();
			const rng = RandomPocketMother.create();
			const group1 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-1' })],
				id: 'group-1',
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-2' })],
				id: 'group-1',
			});

			expect(() => Combat.create('combat-1', [group1, group2], {}, [definition], rng)).toThrow(
				/Duplicated group id/
			);
		});

		it('throws when a combatant groupId differs from its group id', () => {
			const definition = AttributeDefinitionMother.create();
			const rng = RandomPocketMother.create();
			const group = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-2', id: 'combatant-1' })],
				id: 'group-1',
			});

			expect(() => Combat.create('combat-1', [group], {}, [definition], rng)).toThrow(/groupId/);
		});
	});

	describe('apply', () => {
		it('produces a new immutable Combat snapshot', () => {
			const combat = CombatMother.create();
			const newRng = RandomPocketMother.create();
			const newGroup = CombatantGroupMother.create({
				name: 'New Squad',
			});

			const result = combat.apply({
				groups: [newGroup],
				randomPocket: newRng,
				status: 'active',
			});

			expect(result.isRight()).toBe(true);

			const next = result.getRight();
			expect(next).not.toBe(combat);
			expect(next.id).toBe(combat.id);
			expect(next.groups[0]?.name).toBe('New Squad');
			expect(next.randomPocket).toBe(newRng);
		});

		it('transitions to completed status', () => {
			const combat = CombatMother.create();
			const rng = RandomPocketMother.create();
			const group = CombatantGroupMother.create();

			const result = combat.apply({
				groups: [group],
				randomPocket: rng,
				status: 'completed',
			});

			expect(result.getRight().status).toBe('completed');
		});

		it('rejects when combat is already completed', () => {
			const combat = CombatMother.create({ status: 'completed' });

			const result = combat.apply({
				groups: [CombatantGroupMother.create()],
				randomPocket: RandomPocketMother.create(),
				status: 'completed',
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('completed-combat');
			expect(result.getLeft()[0]?.path).toBe('status');
			expect(result.getLeft()[0]?.message).toMatch(/Cannot apply transition to completed combat/);
		});

		it('rejects duplicated group ids', () => {
			const combat = CombatMother.create();
			const group1 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-1' })],
				id: 'group-1',
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-2' })],
				id: 'group-1',
			});

			const result = combat.apply({
				groups: [group1, group2],
				randomPocket: RandomPocketMother.create(),
				status: 'active',
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()).toHaveLength(1);
			expect(result.getLeft()[0]?.reason).toBe('duplicate-group');
			expect(result.getLeft()[0]?.path).toBe('groups.1');
			expect(result.getLeft()[0]?.message).toMatch(/Duplicated group id/);
		});

		it('rejects duplicated combatant ids across groups', () => {
			const combat = CombatMother.create();
			const group1 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-1' })],
				id: 'group-1',
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-2', id: 'combatant-1' })],
				id: 'group-2',
			});

			const result = combat.apply({
				groups: [group1, group2],
				randomPocket: RandomPocketMother.create(),
				status: 'active',
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('duplicate-combatant');
			expect(result.getLeft()[0]?.path).toBe('groups.1.combatants.0');
			expect(result.getLeft()[0]?.message).toMatch(/Duplicated combatant id/);
		});

		it('rejects a combatant whose groupId differs from its group id', () => {
			const combat = CombatMother.create();
			const group = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-2', id: 'combatant-1' })],
				id: 'group-1',
			});

			const result = combat.apply({
				groups: [group],
				randomPocket: RandomPocketMother.create(),
				status: 'active',
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-membership');
			expect(result.getLeft()[0]?.path).toBe('groups.0.combatants.0.groupId');
			expect(result.getLeft()[0]?.message).toMatch(/groupId/);
		});

		it('aggregates every membership rejection', () => {
			const combat = CombatMother.create();
			const group1 = CombatantGroupMother.create({
				combatants: [
					CombatantMother.primitives({ groupId: 'group-2', id: 'combatant-1' }),
					CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-1' }),
				],
				id: 'group-1',
			});
			const group2 = CombatantGroupMother.create({
				combatants: [CombatantMother.primitives({ groupId: 'group-1', id: 'combatant-2' })],
				id: 'group-1',
			});

			const result = combat.apply({
				groups: [group1, group2],
				randomPocket: RandomPocketMother.create(),
				status: 'active',
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.reason)).toEqual([
				'invalid-membership',
				'duplicate-combatant',
				'duplicate-group',
			]);
		});

		it('leaves the previous combat unchanged when the transition is rejected', () => {
			const combat = CombatMother.create();
			const groups = combat.groups;
			const status = combat.status;
			const randomPocket = combat.randomPocket;

			const result = combat.apply({
				groups: [
					CombatantGroupMother.create({
						combatants: [CombatantMother.primitives({ groupId: 'group-2', id: 'combatant-1' })],
						id: 'group-1',
					}),
				],
				randomPocket: RandomPocketMother.create(),
				status: 'completed',
			});

			expect(result.isLeft()).toBe(true);
			expect(combat.groups).toBe(groups);
			expect(combat.status).toBe(status);
			expect(combat.randomPocket).toBe(randomPocket);
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
