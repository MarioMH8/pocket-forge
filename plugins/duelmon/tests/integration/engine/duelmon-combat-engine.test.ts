import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import type { CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatActionBindingSet, CombatEngine, CombatSetup } from '@pocket-forge/combat-engine/domain';
import { CombatRuleMother } from '@pocket-forge/combat-engine/mother/domain';
import { OneVersusOneCombatRule } from '@pocket-forge/combat-engine/rules';
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

describe('Duelmon combat through CombatEngine', () => {
	it('preserves a modifyAttribute successor across the full composition', () => {
		const composition = OneVersusOneCombatRule.create(
			CombatRuleMother.primitives({
				groupConstraints: { ...OneVersusOneCombatRule.CONSTRAINTS },
			}),
			[...DuelmonCombatMother.ATTRIBUTE_DEFINITIONS]
		).getRight();
		const plugin = DuelmonCombatMother.plugin();
		const actionBindings = CombatActionBindingSet.create(
			{ bindings: DuelmonCombatMother.bindings() },
			plugin.actions
		).getRight();
		const rules: readonly CombatRule[] = [composition];
		const engine = new CombatEngine(CombatSetup.create({ actionBindings, actions: plugin, rules }));
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
		expect(CombatEngineFixture.combatantPower(resolution.combat, 'combatant-a')).toBe(35);
		expect(resolution.events).toHaveLength(1);
		expect(resolution.events[0]?.type).toBe('attribute-modified');
		expect(engine.validateComposition(resolution.combat).isRight()).toBe(true);
		expect(combat.toPrimitives()).toEqual(before);
	});
});
