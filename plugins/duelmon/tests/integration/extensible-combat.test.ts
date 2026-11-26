import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import type {
	CombatActionBindingPrimitives,
	CombatRule,
	CombatRulePrimitives,
} from '@pocket-forge/combat-engine/domain';
import { CombatActionBindingSet, CombatEngine, CombatOutcome, CombatSetup } from '@pocket-forge/combat-engine/domain';
import type { CombatCompositionRulePrimitives } from '@pocket-forge/combat-engine/rules';
import { OneVersusOneCombatRule, ThresholdCombatCompletionRule } from '@pocket-forge/combat-engine/rules';
import { ModifyAttributeAction, ModifyAttributeConfig } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const COMPOSITION_PRIMITIVES: CombatCompositionRulePrimitives = {
	attributes: {},
	groupConstraints: { ...OneVersusOneCombatRule.CONSTRAINTS },
};

const COMPLETION_PRIMITIVES: CombatRulePrimitives = {
	attributes: { ...DuelmonCombatMother.DEFAULT_COMPLETION_ATTRIBUTES },
};

const BINDINGS: readonly CombatActionBindingPrimitives[] = [
	{
		actionId: ModifyAttributeAction.ID,
		config: {
			[ModifyAttributeConfig.KEYS.amount]: 25,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'subtract',
			[ModifyAttributeConfig.KEYS.scope]: 'combatant',
		},
		moveId: 'move-1',
	},
	{
		actionId: ModifyAttributeAction.ID,
		config: {
			[ModifyAttributeConfig.KEYS.amount]: 45,
			[ModifyAttributeConfig.KEYS.attributeKey]: 'power',
			[ModifyAttributeConfig.KEYS.operation]: 'set',
			[ModifyAttributeConfig.KEYS.probability]: 1,
			[ModifyAttributeConfig.KEYS.scope]: 'group',
		},
		moveId: 'move-2',
	},
];

class ExtensibleCombatFixture {
	static combatPower(combat: Combat): AttributeValue | undefined {
		return combat.attributes.toPrimitives()['power'];
	}

	static combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
		return combat.groups
			.flatMap(group => group.combatants)
			.find(combatant => combatant.id === combatantId)
			?.attributes.toPrimitives()['power'];
	}

	static compose() {
		const composition = this.createCompositionRule();
		const completion = this.createCompletionRule();
		const plugin = DuelmonCombatMother.plugin();
		const actionBindings = CombatActionBindingSet.create({ bindings: BINDINGS }, plugin.actions).getRight();
		const rules: readonly CombatRule[] = [composition, completion];

		return {
			actionBindings,
			completion,
			composition,
			engine: new CombatEngine(CombatSetup.create({ actionBindings, actions: plugin, rules })),
			plugin,
		};
	}

	static createCompletionRule(): CombatRule {
		return ThresholdCombatCompletionRule.create(
			COMPLETION_PRIMITIVES,
			[...DuelmonCombatMother.COMPLETION_ATTRIBUTE_DEFINITIONS],
			[...DuelmonCombatMother.ATTRIBUTE_DEFINITIONS]
		).getRight();
	}

	static createCompositionRule(): CombatRule {
		return OneVersusOneCombatRule.create(COMPOSITION_PRIMITIVES, [
			...DuelmonCombatMother.ATTRIBUTE_DEFINITIONS,
		]).getRight();
	}

	static groupPower(combat: Combat, groupId: string): AttributeValue | undefined {
		return combat.groups.find(group => group.id === groupId)?.attributes.toPrimitives()['power'];
	}
}

const MOVE_2_INPUT = {
	actorId: 'combatant-a',
	moveId: 'move-2',
	target: { id: 'group-a', scope: 'group' },
} as const;

const MOVE_1_INPUT = {
	actorId: 'combatant-a',
	moveId: 'move-1',
	target: { id: 'combatant-a', scope: 'combatant' },
} as const;

describe('Extensible combat scenario', () => {
	it('hydrates the authored rules and builds the action bindings and completion rule', () => {
		const composition = ExtensibleCombatFixture.createCompositionRule();

		expect(composition).toBeInstanceOf(OneVersusOneCombatRule);
		expect(composition).toMatchObject({ groupConstraints: OneVersusOneCombatRule.CONSTRAINTS });

		const plugin = DuelmonCombatMother.plugin();
		const actionBindingsResult = CombatActionBindingSet.create({ bindings: BINDINGS }, plugin.actions);

		expect(actionBindingsResult.isRight()).toBe(true);

		const actionBindings = actionBindingsResult.getRight();

		expect(actionBindings.bindings).toHaveLength(2);
		expect(actionBindings.find('move-1')?.actionId).toBe(ModifyAttributeAction.ID);
		expect(actionBindings.find('move-1')?.config.toPrimitives()[ModifyAttributeConfig.KEYS.scope]).toBe(
			'combatant'
		);
		expect(actionBindings.find('move-2')?.config.toPrimitives()[ModifyAttributeConfig.KEYS.scope]).toBe('group');
		expect(actionBindings.find('move-2')?.config.toPrimitives()[ModifyAttributeConfig.KEYS.probability]).toBe(1);

		const completion = ExtensibleCombatFixture.createCompletionRule();

		expect(completion).toBeInstanceOf(ThresholdCombatCompletionRule);
	});

	it('rejects an unknown target without mutating the initial combat', () => {
		const { engine } = ExtensibleCombatFixture.compose();
		const combat = DuelmonCombatMother.create();
		const before = combat.toPrimitives();

		const result = engine.resolve(combat, {
			actorId: 'combatant-a',
			moveId: 'move-2',
			target: { id: 'missing-group', scope: 'group' },
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('replays a probabilistic modification from the same combat and RandomPocket state', () => {
		const { engine } = ExtensibleCombatFixture.compose();
		const combat = DuelmonCombatMother.create();
		const initialRandomPocket = combat.randomPocket.toPrimitives();

		const first = engine.resolve(combat, MOVE_2_INPUT);
		const second = engine.resolve(combat, MOVE_2_INPUT);

		expect(first.isRight()).toBe(true);
		expect(second.isRight()).toBe(true);

		const firstResolution = first.getRight();
		const secondResolution = second.getRight();

		expect(firstResolution.events).toEqual(secondResolution.events);
		expect(firstResolution.combat.randomPocket.toPrimitives()).toEqual(
			secondResolution.combat.randomPocket.toPrimitives()
		);
		expect(firstResolution.combat.randomPocket.toPrimitives()).not.toEqual(initialRandomPocket);
		expect(ExtensibleCombatFixture.groupPower(firstResolution.combat, 'group-a')).toBe(45);
		expect(ExtensibleCombatFixture.combatPower(firstResolution.combat)).toBe(50);
	});

	it('crosses the completion threshold with attributes at combat, group, and combatant level', () => {
		const { engine } = ExtensibleCombatFixture.compose();
		const combat = DuelmonCombatMother.create();

		const moved = engine.resolve(combat, MOVE_2_INPUT);

		expect(moved.isRight()).toBe(true);

		const activeCombat = moved.getRight().combat;
		const before = activeCombat.toPrimitives();

		const result = engine.resolve(activeCombat, MOVE_1_INPUT);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();

		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual(CombatOutcome.victory('group-a'));
		expect(resolution.events.map(event => event.type)).toEqual(['attribute-modified', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(resolution.events[1]?.payload).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
		expect(ExtensibleCombatFixture.combatantPower(resolution.combat, 'combatant-a')).toBe(5);
		expect(ExtensibleCombatFixture.groupPower(resolution.combat, 'group-a')).toBe(45);
		expect(ExtensibleCombatFixture.combatPower(resolution.combat)).toBe(50);
		expect(activeCombat.toPrimitives()).toEqual(before);
	});

	it('rejects a resolution after completion without producing a successor', () => {
		const { engine } = ExtensibleCombatFixture.compose();
		const moved = engine.resolve(DuelmonCombatMother.create(), MOVE_2_INPUT).getRight();
		const completed = engine.resolve(moved.combat, MOVE_1_INPUT).getRight();
		const before = completed.combat.toPrimitives();

		const result = engine.resolve(completed.combat, MOVE_1_INPUT);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
		expect(completed.combat.toPrimitives()).toEqual(before);
	});
});
