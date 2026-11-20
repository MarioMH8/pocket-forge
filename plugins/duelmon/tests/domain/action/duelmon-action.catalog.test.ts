import type { CombatMoveBindingPrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatMoveBindingSet } from '@pocket-forge/combat-engine/domain';
import { ModifyAttributeAction, ModifyAttributeConfig } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function binding(overrides?: Partial<CombatMoveBindingPrimitives>): CombatMoveBindingPrimitives {
	return {
		actionId: ModifyAttributeAction.ID,
		config: {
			[ModifyAttributeConfig.KEYS.amount]: 5,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'add',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		},
		moveId: 'move-1',
		...overrides,
	};
}

function create(bindings: readonly CombatMoveBindingPrimitives[]) {
	return CombatMoveBindingSet.create({ bindings }, DuelmonCombatMother.plugin().actions);
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
				config: { [ModifyAttributeConfig.KEYS.attributeKey]: 'power' },
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
