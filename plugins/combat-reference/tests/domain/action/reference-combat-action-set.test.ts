import type { CombatMoveBindingPrimitives } from '@pocket-forge/combat/domain';
import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_CONFIG_KEYS,
	ReferenceCombatActionSet,
} from '@pocket-forge/combat-reference/domain';
import { ReferenceCombatActionSetMother } from '@pocket-forge/combat-reference/mother/domain';
import { describe, expect, it } from 'bun:test';

import { referencePlugin } from '../support/reference.fixtures';

const PLUGIN = referencePlugin();

function create(bindings: readonly CombatMoveBindingPrimitives[]) {
	return ReferenceCombatActionSet.create(bindings, PLUGIN.actions);
}

describe('ReferenceCombatActionSet', () => {
	it('builds a valid action set from authored bindings', () => {
		const result = create(ReferenceCombatActionSetMother.bindings());

		expect(result.isRight()).toBe(true);

		const actionSet = result.getRight();
		expect(actionSet.plugin).toEqual({ id: 'pocket-forge.reference' });
		expect(actionSet.bindings).toHaveLength(2);
		expect(actionSet.find('move-1')?.actionId).toBe(MODIFY_ATTRIBUTE_ACTION_ID);
		expect(actionSet.find('move-2')?.config.toPrimitives()[REFERENCE_CONFIG_KEYS.probability]).toBe(0.5);
	});

	it('applies scope and operation defaults', () => {
		const result = create([
			{
				actionId: MODIFY_ATTRIBUTE_ACTION_ID,
				config: {
					[REFERENCE_CONFIG_KEYS.amount]: 3,
					[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
				},
				moveId: 'move-1',
			},
		]);

		expect(result.isRight()).toBe(true);

		const config = result.getRight().find('move-1')?.config.toPrimitives();

		expect(config).toEqual({
			[REFERENCE_CONFIG_KEYS.amount]: 3,
			[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
			[REFERENCE_CONFIG_KEYS.operation]: 'set',
			[REFERENCE_CONFIG_KEYS.scope]: 'combat',
		});
	});

	it('rejects a binding without an amount through validateConfig', () => {
		const result = create([
			{
				actionId: MODIFY_ATTRIBUTE_ACTION_ID,
				config: {
					[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
				},
				moveId: 'move-1',
			},
		]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe('bindings.0.config');
		expect(result.getLeft()[0]?.message).toBe('reference.amount is required');
	});

	it('rejects an unknown action', () => {
		const result = create([{ actionId: 'unknown', config: {}, moveId: 'move-1' }]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('unknown-action');
		expect(result.getLeft()[0]?.path).toBe('bindings.0.actionId');
	});

	it('rejects duplicated Move ids', () => {
		const result = create([
			...ReferenceCombatActionSetMother.bindings(),
			{ ...ReferenceCombatActionSetMother.binding(), moveId: 'move-1' },
		]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().some(error => error.reason === 'duplicate-move-binding')).toBe(true);
	});
});
