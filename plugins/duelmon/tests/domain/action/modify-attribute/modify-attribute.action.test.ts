import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import {
	DuelmonCombatInput,
	DuelmonTarget,
	ModifyAttributeAction,
	ModifyAttributeConfig,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const ACTOR_ID = 'combatant-a';
const MOVE_ID = 'move-1';
const ACTION = new ModifyAttributeAction(DuelmonCombatMother.ATTRIBUTE_DEFINITIONS);

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

function resolve(overrides: Record<string, AttributeValue>, target = DuelmonTarget.create('combatant', ACTOR_ID)) {
	const combat = DuelmonCombatMother.create();
	const actionBindings = DuelmonCombatMother.actionBindings({
		[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
		[ModifyAttributeConfig.KEYS.operation]: 'add',
		[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		...overrides,
	});
	const binding = actionBindings.find(MOVE_ID);

	if (!binding) {
		throw new Error('Missing binding');
	}

	const input = DuelmonCombatInput.create(ACTOR_ID, MOVE_ID, target);

	return {
		combat,
		result: ACTION.resolve({ actionBindings, combat, input }, input, binding),
	};
}

describe('ModifyAttributeAction', () => {
	it('declares its identifier and configuration descriptor', () => {
		expect(ACTION.id).toBe('modifyAttribute');
		expect(ACTION.descriptor.id).toBe(ACTION.id);
		expect(ACTION.descriptor.configDefinitions).toBe(ModifyAttributeConfig.DEFINITIONS);
	});

	it('updates the resolved target and emits a success event', () => {
		const { combat, result } = resolve({ [ModifyAttributeConfig.KEYS.amount]: 7 });

		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantPower(transition.combat, ACTOR_ID)).toBe(37);
		expect(transition.events[0]).toMatchObject({
			payload: {
				actionId: ACTION.id,
				after: 37,
				attributeKey: 'power',
				before: 30,
				operation: 'add',
				scope: 'combatant',
				targetId: ACTOR_ID,
			},
			type: 'attribute-modified',
		});
		expect(combatantPower(combat, ACTOR_ID)).toBe(30);
	});

	it('emits a failed event and advances randomness without writing on a failed draw', () => {
		const { combat, result } = resolve({
			[ModifyAttributeConfig.KEYS.amount]: 7,
			[ModifyAttributeConfig.KEYS.probability]: 0,
		});

		expect(result.isRight()).toBe(true);

		const transition = result.getRight();

		expect(combatantPower(transition.combat, ACTOR_ID)).toBe(30);
		expect(transition.events[0]).toMatchObject({
			payload: {
				actionId: ACTION.id,
				attributeKey: 'power',
				probability: 0,
				scope: 'combatant',
			},
			type: 'attribute-modification-failed',
		});
		expect(transition.combat.randomPocket.toPrimitives()).not.toEqual(combat.randomPocket.toPrimitives());
	});

	it('rejects an unknown actor before touching the target', () => {
		const combat = DuelmonCombatMother.create();
		const actionBindings = DuelmonCombatMother.actionBindings({
			[ModifyAttributeConfig.KEYS.amount]: 1,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'add',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		});
		const binding = actionBindings.find(MOVE_ID);

		if (!binding) {
			throw new Error('Missing binding');
		}

		const input = DuelmonCombatInput.create('missing-actor', MOVE_ID, DuelmonTarget.create('combatant', ACTOR_ID));
		const result = ACTION.resolve({ actionBindings, combat, input }, input, binding);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-input');
		expect(result.getLeft()[0]?.path).toBe('input.actorId');
	});

	it('rejects a target scope that the binding does not expect', () => {
		const { result } = resolve(
			{ [ModifyAttributeConfig.KEYS.amount]: 1 },
			DuelmonTarget.create('group', 'group-a')
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(result.getLeft()[0]?.path).toBe('input.target.scope');
	});
});
