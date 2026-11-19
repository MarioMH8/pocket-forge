import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat, CombatCompletionRule } from '@pocket-forge/combat/domain';
import { CombatActionSet, CombatEngine, CombatSetup } from '@pocket-forge/combat/domain';
import { CombatRulesetMother } from '@pocket-forge/combat/mother/domain';
import { OneVersusOneCombatRuleset } from '@pocket-forge/combat/rulesets';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

describe('Duelmon combat through CombatEngine', () => {
	it('preserves a modifyAttribute successor across the full composition', () => {
		const ruleset = OneVersusOneCombatRuleset.create(
			CombatRulesetMother.primitives({
				groupConstraints: { ...OneVersusOneCombatRuleset.CONSTRAINTS },
			}),
			[...DuelmonCombatMother.ATTRIBUTE_DEFINITIONS]
		).getRight();
		const plugin = DuelmonCombatMother.plugin();
		const actionSet = CombatActionSet.create(
			{ bindings: DuelmonCombatMother.bindings() },
			plugin.actions
		).getRight();
		const completion: CombatCompletionRule = {
			// eslint-disable-next-line unicorn/no-useless-undefined
			evaluate: () => undefined,
		};
		const engine = new CombatEngine(CombatSetup.create({ actions: plugin, actionSet, completion, ruleset }));
		const combat = DuelmonCombatMother.create();
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
