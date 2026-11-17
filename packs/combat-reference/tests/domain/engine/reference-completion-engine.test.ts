import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { CombatEngine } from '@pocket-forge/combat/domain';
import { CombatSetupMother } from '@pocket-forge/combat/mother/domain';
import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_CONFIG_KEYS,
	ReferenceCombatActionSet,
	ThresholdCombatCompletionRule,
} from '@pocket-forge/combat-reference/domain';
import { describe, expect, it } from 'bun:test';

import {
	ATTRIBUTE_DEFINITIONS,
	completionRuleset,
	referenceCombat,
	referencePlugin,
	VERSION_VALIDATOR,
} from '../support/reference.fixtures';

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

describe('Reference completion through CombatEngine', () => {
	it('completes combat when the threshold rule is reached', () => {
		const ruleset = completionRuleset();
		const plugin = referencePlugin();
		const actionSet = ReferenceCombatActionSet.create(
			[
				{
					actionId: MODIFY_ATTRIBUTE_ACTION_ID,
					config: {
						[REFERENCE_CONFIG_KEYS.amount]: 25,
						[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
						[REFERENCE_CONFIG_KEYS.operation]: 'subtract',
						[REFERENCE_CONFIG_KEYS.scope]: 'combatant',
					},
					moveId: 'move-1',
				},
			],
			plugin.actions,
			VERSION_VALIDATOR
		).getRight();
		const completion = ThresholdCombatCompletionRule.create(ruleset, ATTRIBUTE_DEFINITIONS).getRight();
		const engine = new CombatEngine(CombatSetupMother.create({ actions: plugin, actionSet, completion, ruleset }));
		const combat = referenceCombat();
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
