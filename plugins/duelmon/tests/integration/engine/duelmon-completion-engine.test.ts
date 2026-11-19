import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { CombatEngine, CombatSetup } from '@pocket-forge/combat-engine/domain';
import { ThresholdCombatCompletionRule } from '@pocket-forge/combat-engine/rulesets';
import { ModifyAttributeConfig } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

describe('Duelmon completion through CombatEngine', () => {
	it('completes combat when the threshold rule is reached', () => {
		const ruleset = DuelmonCombatMother.completionRuleset();
		const plugin = DuelmonCombatMother.plugin();
		const actionSet = DuelmonCombatMother.actionSet({
			[ModifyAttributeConfig.KEYS.amount]: 25,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'subtract',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		});
		const completion = ThresholdCombatCompletionRule.create(
			ruleset,
			DuelmonCombatMother.ATTRIBUTE_DEFINITIONS
		).getRight();
		const engine = new CombatEngine(CombatSetup.create({ actions: plugin, actionSet, completion, ruleset }));
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
		expect(resolution.outcome).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
		expect(combatantPower(resolution.combat, 'combatant-a')).toBe(5);
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
