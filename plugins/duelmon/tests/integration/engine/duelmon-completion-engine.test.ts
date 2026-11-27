import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import type { CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatEngine, CombatOutcome, CombatSetup } from '@pocket-forge/combat-engine/domain';
import { ModifyAttributeConfig } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

class CombatEngineFixture {
	static combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
		return combat.groups
			.flatMap(group => group.combatants)
			.find(combatant => combatant.id === combatantId)
			?.attributes.toPrimitives()['power'];
	}
}

describe('Duelmon completion through CombatEngine', () => {
	it('completes combat when the threshold rule is reached', () => {
		const composition = DuelmonCombatMother.compositionRule();
		const completion = DuelmonCombatMother.completionRule();
		const plugin = DuelmonCombatMother.plugin();
		const actionBindings = DuelmonCombatMother.actionBindings({
			[ModifyAttributeConfig.KEYS.amount]: 25,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'subtract',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		});
		const rules: readonly CombatRule[] = [composition, completion];
		const engine = new CombatEngine(CombatSetup.create({ actionBindings, actions: plugin, rules }));
		const combat = DuelmonCombatMother.create();
		const input = {
			actorId: 'combatant-a',
			moveId: 'move-1',
			target: { id: 'combatant-a', scope: 'combatant' },
		};

		const result = engine.resolve(combat, input);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();
		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual(CombatOutcome.victory('group-a'));
		expect(CombatEngineFixture.combatantPower(resolution.combat, 'combatant-a')).toBe(5);
		expect(resolution.events.map(event => event.type)).toEqual(['attribute-modified', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(resolution.events[1]?.payload).toEqual({
			status: 'victory',
			winnerGroupId: 'group-a',
		});

		const second = engine.resolve(resolution.combat, input);

		expect(second.isLeft()).toBe(true);
		expect(second.getLeft()[0]?.reason).toBe('combat-not-active');
	});
});
