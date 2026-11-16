import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat, CombatCompletionRule } from '@pocket-forge/combat/domain';
import { CombatEngine } from '@pocket-forge/combat/domain';
import { CombatRulesetMother } from '@pocket-forge/combat/mother/domain';
import { OneVersusOneCombatRuleset, ReferenceCombatActionSet } from '@pocket-forge/combat-reference/domain';
import { ReferenceCombatActionSetMother } from '@pocket-forge/combat-reference/mother/domain';
import { describe, expect, it } from 'bun:test';

import {
	ATTRIBUTE_DEFINITIONS,
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

describe('Reference combat through CombatEngine', () => {
	it('preserves a modifyAttribute successor across the full composition', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			CombatRulesetMother.primitives({
				contractVersion: OneVersusOneCombatRuleset.VERSION,
				groupConstraints: { ...OneVersusOneCombatRuleset.CONSTRAINTS },
				id: 'reference-1v1',
				kind: OneVersusOneCombatRuleset.KIND,
				name: 'Reference 1v1',
			}),
			[...ATTRIBUTE_DEFINITIONS],
			VERSION_VALIDATOR
		).getRight();
		const plugin = referencePlugin();
		const actionSet = ReferenceCombatActionSet.create(
			ReferenceCombatActionSetMother.bindings(),
			plugin.actions,
			VERSION_VALIDATOR
		).getRight();
		const completion: CombatCompletionRule = {
			contractVersion: '1.0.0',
			// eslint-disable-next-line unicorn/no-useless-undefined
			evaluate: () => undefined,
			kind: 'none',
		};
		const engine = new CombatEngine(ruleset, plugin, actionSet, completion);
		const combat = referenceCombat();
		const before = combat.toPrimitives();

		expect(engine.validateComposition(combat).isRight()).toBe(true);

		const result = engine.resolve(combat, {
			actorId: 'combatant-a',
			moveId: 'move-1',
			target: { id: 'combatant-a', scope: 'combatant' },
		});

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();

		expect(resolution.outcome).toBeUndefined();
		expect(combatantPower(resolution.combat, 'combatant-a')).toBe(35);
		expect(resolution.events).toHaveLength(1);
		expect(resolution.events[0]?.type).toBe('attribute-modified');
		expect(engine.validateComposition(resolution.combat).isRight()).toBe(true);
		expect(combat.toPrimitives()).toEqual(before);
	});
});
