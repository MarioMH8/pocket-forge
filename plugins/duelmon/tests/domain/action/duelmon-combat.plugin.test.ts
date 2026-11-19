import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatActionSet } from '@pocket-forge/combat/domain';
import { CombatActionSet as CombatActionSetEntity } from '@pocket-forge/combat/domain';
import { ModifyAttributeAction, ModifyAttributeConfig } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLUGIN = DuelmonCombatMother.plugin();
const ACTOR_ID = 'combatant-a';
const MOVE_ID = 'move-1';

function config(overrides: AttributeValues): AttributeValues {
	return {
		[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
		[ModifyAttributeConfig.KEYS.operation]: 'set',
		[ModifyAttributeConfig.KEYS.scope]: 'combat',
		...overrides,
	};
}

function actionSet(overrides: AttributeValues, moveId = MOVE_ID): CombatActionSet {
	return DuelmonCombatMother.actionSet(config(overrides), moveId);
}

function combatPower(combat: Combat): AttributeValue | undefined {
	return combat.attributes.toPrimitives()['power'];
}

function groupPower(combat: Combat, groupId: string): AttributeValue | undefined {
	return combat.groups.find(group => group.id === groupId)?.attributes.toPrimitives()['power'];
}

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

describe('DuelmonCombatPlugin', () => {
	describe('modifyAttribute set', () => {
		it('sets a combat attribute and emits a serializable success event', () => {
			const combat = DuelmonCombatMother.create();
			const before = combat.toPrimitives();
			const set = actionSet({ [ModifyAttributeConfig.KEYS.amount]: 75 });

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isRight()).toBe(true);

			const transition = result.getRight();
			expect(transition.combat.attributes.toPrimitives()['power']).toBe(75);
			expect(transition.events).toHaveLength(1);

			const [event] = transition.events;

			expect(event?.sequence).toBe(1);
			expect(event?.type).toBe('attribute-modified');
			expect(event?.payload).toMatchObject({
				actionId: ModifyAttributeAction.ID,
				after: 75,
				attributeKey: 'power',
				before: 50,
				operation: 'set',
				scope: 'combat',
			});
			expect(event?.payload['targetId']).toBeUndefined();
			// eslint-disable-next-line unicorn/prefer-structured-clone
			expect(JSON.parse(JSON.stringify(event))).toEqual(event);
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('sets a group attribute', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 55,
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'group-a', scope: 'group' } },
			});

			expect(result.isRight()).toBe(true);

			const transition = result.getRight();

			expect(groupPower(transition.combat, 'group-a')).toBe(55);
			expect(transition.events[0]?.payload['targetId']).toBe('group-a');
		});

		it('sets a combatant attribute', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 15,
				[ModifyAttributeConfig.KEYS.scope]: 'combatant',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'combatant-a', scope: 'combatant' } },
			});

			expect(result.isRight()).toBe(true);
			expect(combatantPower(result.getRight().combat, 'combatant-a')).toBe(15);
		});

		it('rejects a set value outside the definition constraints', () => {
			const combat = DuelmonCombatMother.create();
			const before = combat.toPrimitives();
			const set = actionSet({ [ModifyAttributeConfig.KEYS.amount]: 200 });

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('rejected');
			expect(result.getLeft()[0]?.path).toBe(`config.${ModifyAttributeConfig.KEYS.amount}`);
			expect(combat.toPrimitives()).toEqual(before);
		});
	});

	describe('modifyAttribute add and subtract', () => {
		it('adds to a group attribute', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 15,
				[ModifyAttributeConfig.KEYS.operation]: 'add',
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'group-a', scope: 'group' } },
			});

			expect(result.isRight()).toBe(true);
			expect(groupPower(result.getRight().combat, 'group-a')).toBe(55);
			expect(result.getRight().events[0]?.payload).toMatchObject({ after: 55, before: 40, operation: 'add' });
		});

		it('subtracts from a combatant attribute', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 12,
				[ModifyAttributeConfig.KEYS.operation]: 'subtract',
				[ModifyAttributeConfig.KEYS.scope]: 'combatant',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'combatant-a', scope: 'combatant' } },
			});

			expect(result.isRight()).toBe(true);
			expect(combatantPower(result.getRight().combat, 'combatant-a')).toBe(18);
		});

		it('saturates an add at the definition maximum', () => {
			const combat = DuelmonCombatMother.create(undefined, { group: 95 });
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 20,
				[ModifyAttributeConfig.KEYS.operation]: 'add',
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'group-a', scope: 'group' } },
			});

			expect(result.isRight()).toBe(true);
			expect(groupPower(result.getRight().combat, 'group-a')).toBe(100);
		});

		it('saturates a subtract at the definition minimum', () => {
			const combat = DuelmonCombatMother.create(undefined, { combatant: 5 });
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 20,
				[ModifyAttributeConfig.KEYS.operation]: 'subtract',
				[ModifyAttributeConfig.KEYS.scope]: 'combatant',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'combatant-a', scope: 'combatant' } },
			});

			expect(result.isRight()).toBe(true);
			expect(combatantPower(result.getRight().combat, 'combatant-a')).toBe(0);
		});

		it('rejects add and subtract on a non-numeric attribute', () => {
			const combat = DuelmonCombatMother.create();

			for (const operation of ['add', 'subtract'] as const) {
				const set = actionSet({
					[ModifyAttributeConfig.KEYS.amount]: 1,
					[ModifyAttributeConfig.KEYS.attributeKey]: 'banner',
					[ModifyAttributeConfig.KEYS.operation]: operation,
					[ModifyAttributeConfig.KEYS.scope]: 'combatant',
				});

				const result = PLUGIN.resolve({
					actionSet: set,
					combat,
					input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'combatant-a', scope: 'combatant' } },
				});

				expect(result.isLeft()).toBe(true);
				expect(result.getLeft()[0]?.reason).toBe('invalid-target');
			}
		});
	});

	describe('targeting and binding validation', () => {
		it('rejects an unknown Move binding', () => {
			const set = actionSet({ [ModifyAttributeConfig.KEYS.amount]: 1 });

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: 'missing-move', target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action');
			expect(result.getLeft()[0]?.path).toBe('input.moveId');
		});

		it('rejects a binding to another action', () => {
			const set = CombatActionSetEntity.fromPrimitives({
				bindings: [{ actionId: 'otherAction', config: {}, moveId: MOVE_ID }],
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action');
			expect(result.getLeft()[0]?.path).toBe('actionSet.bindings');
		});

		it('rejects an unknown actor', () => {
			const result = PLUGIN.resolve({
				actionSet: actionSet({ [ModifyAttributeConfig.KEYS.amount]: 1 }),
				combat: DuelmonCombatMother.create(),
				input: { actorId: 'missing-actor', moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.actorId');
		});

		it('rejects a target scope that does not match the binding', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
			expect(result.getLeft()[0]?.path).toBe('input.target.scope');
		});

		it('rejects a missing group target id', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'group' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
			expect(result.getLeft()[0]?.path).toBe('input.target.id');
		});

		it('rejects an unknown group target id', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.scope]: 'group',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'missing-group', scope: 'group' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		});

		it('rejects a missing combatant target id', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.scope]: 'combatant',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combatant' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		});

		it('rejects an unknown combatant target id', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.scope]: 'combatant',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'missing-combatant', scope: 'combatant' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		});

		it('ignores a combat target id', () => {
			const result = PLUGIN.resolve({
				actionSet: actionSet({ [ModifyAttributeConfig.KEYS.amount]: 60 }),
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: 'ignored', scope: 'combat' } },
			});

			expect(result.isRight()).toBe(true);
			expect(result.getRight().events[0]?.payload['targetId']).toBeUndefined();
		});

		it('rejects an unknown attribute key', () => {
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 1,
				[ModifyAttributeConfig.KEYS.attributeKey]: 'missing',
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-target');
			expect(result.getLeft()[0]?.path).toBe(`config.${ModifyAttributeConfig.KEYS.attributeKey}`);
		});
	});

	describe('input validation', () => {
		const set = actionSet({ [ModifyAttributeConfig.KEYS.amount]: 1 });

		it('rejects a non-object input', () => {
			const result = PLUGIN.resolve({ actionSet: set, combat: DuelmonCombatMother.create(), input: 'nope' });

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input');
		});

		it('rejects a missing actor id', () => {
			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.actorId');
		});

		it('rejects a missing move id', () => {
			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, target: { scope: 'combat' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.moveId');
		});

		it('rejects a target without an object shape', () => {
			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: 'combat' },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.target');
		});

		it('rejects an unknown target scope', () => {
			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'team' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.target.scope');
		});

		it('rejects an empty target id', () => {
			const result = PLUGIN.resolve({
				actionSet: set,
				combat: DuelmonCombatMother.create(),
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { id: ' ', scope: 'group' } },
			});

			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input.target.id');
		});
	});

	describe('probability', () => {
		it('applies the change and advances the RandomPocket exactly once on success', () => {
			const combat = DuelmonCombatMother.create();
			const [draw, expectedRandomPocket] = combat.randomPocket.chance(1);
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 75,
				[ModifyAttributeConfig.KEYS.probability]: 1,
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(draw).toBe(true);
			expect(result.isRight()).toBe(true);

			const transition = result.getRight();

			expect(combatPower(transition.combat)).toBe(75);
			expect(transition.combat.randomPocket.toPrimitives()).toEqual(expectedRandomPocket.toPrimitives());
			expect(transition.events[0]?.type).toBe('attribute-modified');
		});

		it('keeps attributes but advances the RandomPocket on failure', () => {
			const combat = DuelmonCombatMother.create();
			const before = combat.toPrimitives();
			const [, expectedRandomPocket] = combat.randomPocket.chance(0);
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 75,
				[ModifyAttributeConfig.KEYS.probability]: 0,
			});

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isRight()).toBe(true);

			const transition = result.getRight();

			expect(combatPower(transition.combat)).toBe(50);
			expect(transition.combat.randomPocket.toPrimitives()).toEqual(expectedRandomPocket.toPrimitives());
			expect(transition.events[0]).toEqual({
				payload: {
					actionId: ModifyAttributeAction.ID,
					attributeKey: 'power',
					probability: 0,
					scope: 'combat',
				},
				sequence: 1,
				type: 'attribute-modification-failed',
			});
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('does not draw when probability is absent', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({ [ModifyAttributeConfig.KEYS.amount]: 75 });

			const result = PLUGIN.resolve({
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			});

			expect(result.isRight()).toBe(true);
			expect(result.getRight().combat.randomPocket.toPrimitives()).toEqual(combat.randomPocket.toPrimitives());
			expect(combatPower(result.getRight().combat)).toBe(75);
		});

		it('replays deterministically from the same Combat and RandomPocket state', () => {
			const combat = DuelmonCombatMother.create();
			const set = actionSet({
				[ModifyAttributeConfig.KEYS.amount]: 10,
				[ModifyAttributeConfig.KEYS.operation]: 'add',
				[ModifyAttributeConfig.KEYS.probability]: 0.5,
			});
			const context = {
				actionSet: set,
				combat,
				input: { actorId: ACTOR_ID, moveId: MOVE_ID, target: { scope: 'combat' } },
			};

			const first = PLUGIN.resolve(context).getRight();
			const second = PLUGIN.resolve(context).getRight();

			expect(first.events).toEqual(second.events);
			expect(first.combat.attributes.toPrimitives()).toEqual(second.combat.attributes.toPrimitives());
			expect(first.combat.randomPocket.toPrimitives()).toEqual(second.combat.randomPocket.toPrimitives());
		});
	});
});
