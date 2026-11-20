import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { CombatantGroupMother } from '@pocket-forge/combat/mother/domain';
import { UseMoveAction } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLUGIN = DuelmonCombatMother.plugin();
const ATTACKER_ID = 'combatant-a';
const TARGET_ID = 'combatant-b';

function stats(overrides: AttributeValues = {}): AttributeValues {
	return {
		attack: 100,
		defense: 80,
		hp: 100,
		level: 50,
		special: 120,
		...overrides,
	};
}

function combatWith(
	attackerStats: AttributeValues,
	targetSpecies: string,
	targetStats: AttributeValues,
	overrides: Partial<CombatPrimitives> = {}
): Combat {
	return CombatEntity.fromPrimitives({
		attributes: {},
		groups: [
			CombatantGroupMother.primitives({
				attributes: {},
				combatants: [DuelmonCombatMother.combatant(ATTACKER_ID, 'group-a', 'emberling', attackerStats)],
				id: 'group-a',
			}),
			CombatantGroupMother.primitives({
				attributes: {},
				combatants: [DuelmonCombatMother.combatant(TARGET_ID, 'group-b', targetSpecies, targetStats)],
				id: 'group-b',
			}),
		],
		id: 'combat-1',
		randomPocket: { seed: 42, state: 42 },
		status: 'active',
		...overrides,
	});
}

function combatantHp(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['hp'];
}

describe('UseMoveAction', () => {
	it('deals damage, emits an event, and advances the RandomPocket', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const before = combat.toPrimitives();
		const [randomFactor, expectedRandomPocket] = combat.randomPocket.nextInt(217, 255);
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'ember-burst',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(randomFactor).toBe(240);
		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantHp(transition.combat, TARGET_ID)).toBe(31);
		expect(transition.events).toEqual([
			{
				payload: {
					actionId: UseMoveAction.ID,
					attackerId: ATTACKER_ID,
					damage: 69,
					effectiveness: 2,
					moveId: 'ember-burst',
					targetId: TARGET_ID,
				},
				sequence: 1,
				type: 'move-used',
			},
		]);
		expect(transition.combat.randomPocket.toPrimitives()).toEqual(expectedRandomPocket.toPrimitives());
		expect(transition.combat.randomPocket.toPrimitives()).not.toEqual(combat.randomPocket.toPrimitives());
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('uses Attack and Defense for a Physical move', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const [, expectedRandomPocket] = combat.randomPocket.nextInt(217, 255);
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['tackle']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'tackle',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantHp(transition.combat, TARGET_ID)).toBe(84);
		expect(transition.events[0]?.payload).toMatchObject({ damage: 16, effectiveness: 1 });
		expect(transition.combat.randomPocket.toPrimitives()).toEqual(expectedRandomPocket.toPrimitives());
	});

	it('saturates target HP at zero', () => {
		const combat = combatWith(stats({ level: 100 }), 'sprout', stats({ hp: 10 }));
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'ember-burst',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);
		expect(combatantHp(result.getRight().combat, TARGET_ID)).toBe(0);
	});

	it('emits a miss event and leaves HP unchanged when accuracy fails', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const before = combat.toPrimitives();
		const [hit, expectedRandomPocket] = combat.randomPocket.chance(0.01);
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['gamble']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'gamble',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(hit).toBe(false);
		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantHp(transition.combat, TARGET_ID)).toBe(100);
		expect(transition.events).toEqual([
			{
				payload: {
					actionId: UseMoveAction.ID,
					attackerId: ATTACKER_ID,
					moveId: 'gamble',
					targetId: TARGET_ID,
				},
				sequence: 1,
				type: 'move-missed',
			},
		]);
		expect(transition.combat.randomPocket.toPrimitives()).toEqual(expectedRandomPocket.toPrimitives());
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('deals no damage to an immune target without consuming randomness', () => {
		const combat = combatWith(stats(), 'wisp', stats({ attack: 90, defense: 100, hp: 100, special: 90 }));
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['tackle']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'tackle',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantHp(transition.combat, TARGET_ID)).toBe(100);
		expect(transition.events).toEqual([
			{
				payload: {
					actionId: UseMoveAction.ID,
					attackerId: ATTACKER_ID,
					damage: 0,
					effectiveness: 0,
					moveId: 'tackle',
					targetId: TARGET_ID,
				},
				sequence: 1,
				type: 'move-used',
			},
		]);
		expect(transition.combat.randomPocket.toPrimitives()).toEqual(combat.randomPocket.toPrimitives());
	});

	it('reports an unknown move id as structured invalid input', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['missing-move']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'missing-move',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-input');
		expect(result.getLeft()[0]?.path).toBe('input.moveId');
	});

	it('accepts a damaging move with zero power', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['low-sweep']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'low-sweep',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantHp(transition.combat, TARGET_ID)).toBe(99);
		expect(transition.events[0]?.type).toBe('move-used');
	});

	it('rejects a Status move', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const before = combat.toPrimitives();
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(['oath']),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'oath',
				target: { id: TARGET_ID, scope: 'combatant' },
			},
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('rejected');
		expect(result.getLeft()[0]?.path).toBe('input.moveId');
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects a group target', () => {
		const combat = DuelmonCombatMother.useMoveCombat();
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings(),
			combat,
			input: {
				actorId: ATTACKER_ID,
				moveId: 'ember-burst',
				target: { id: 'group-b', scope: 'group' },
			},
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(result.getLeft()[0]?.path).toBe('input.target.scope');
	});
});
