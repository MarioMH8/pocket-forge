import type { CombatMoveBindingPrimitives } from '@pocket-forge/combat/domain';
import { CombatActionSet } from '@pocket-forge/combat/domain';
import { DUELMON_CONFIG_KEYS, MODIFY_ATTRIBUTE_ACTION_ID } from '@pocket-forge/duelmon/domain';
import { describe, expect, it } from 'bun:test';

import { duelmonPlugin } from '../support/duelmon.fixtures';

function binding(overrides?: Partial<CombatMoveBindingPrimitives>): CombatMoveBindingPrimitives {
	return {
		actionId: MODIFY_ATTRIBUTE_ACTION_ID,
		config: {
			[DUELMON_CONFIG_KEYS.amount]: 5,
			[DUELMON_CONFIG_KEYS.attributeKey]: 'power',
			[DUELMON_CONFIG_KEYS.operation]: 'add',
			[DUELMON_CONFIG_KEYS.scope]: 'combatant',
		},
		moveId: 'move-1',
		...overrides,
	};
}

function create(bindings: readonly CombatMoveBindingPrimitives[]) {
	return CombatActionSet.create({ bindings }, duelmonPlugin().actions);
}

describe('duelmon combat catalog', () => {
	it('accepts authored bindings that match the catalog', () => {
		expect(create([binding()]).isRight()).toBe(true);
	});

	it('rejects a binding with an unknown action id', () => {
		const result = create([binding({ actionId: 'unknown' })]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('unknown-action');
	});

	it('rejects a config that misses a required value', () => {
		const result = create([
			binding({
				config: { [DUELMON_CONFIG_KEYS.attributeKey]: 'power' },
			}),
		]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
	});

	it('rejects a duplicated move binding', () => {
		const result = create([binding(), binding()]);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('duplicate-move-binding');
	});
});
