import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type {
	Combat,
	CombatMoveBindingPrimitives,
	CombatRuleset,
	CombatRulesetPrimitives,
} from '@pocket-forge/combat/domain';
import { CombatEngine } from '@pocket-forge/combat/domain';
import { CombatSetupMother } from '@pocket-forge/combat/mother/domain';
import { OneVersusOneCombatRuleset, ThresholdCombatCompletionRule } from '@pocket-forge/combat/rulesets';
import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_CONFIG_KEYS,
	ReferenceCombatActionSet,
} from '@pocket-forge/combat-reference/domain';
import { describe, expect, it } from 'bun:test';

import {
	ATTRIBUTE_DEFINITIONS,
	COMPLETION_ATTRIBUTE_DEFINITIONS,
	DEFAULT_COMPLETION_ATTRIBUTES,
	referenceCombat,
	referencePlugin,
} from '../domain/support/reference.fixtures';

const RULESET_PRIMITIVES: CombatRulesetPrimitives = {
	attributes: { ...DEFAULT_COMPLETION_ATTRIBUTES },
	groupConstraints: { ...OneVersusOneCombatRuleset.CONSTRAINTS },
	id: 'extensible-1v1',
};

const BINDINGS: readonly CombatMoveBindingPrimitives[] = [
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
	{
		actionId: MODIFY_ATTRIBUTE_ACTION_ID,
		config: {
			[REFERENCE_CONFIG_KEYS.amount]: 45,
			[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
			[REFERENCE_CONFIG_KEYS.operation]: 'set',
			[REFERENCE_CONFIG_KEYS.probability]: 1,
			[REFERENCE_CONFIG_KEYS.scope]: 'group',
		},
		moveId: 'move-2',
	},
];

function createRuleset(): CombatRuleset {
	return OneVersusOneCombatRuleset.create(RULESET_PRIMITIVES, [...COMPLETION_ATTRIBUTE_DEFINITIONS]).getRight();
}

function compose() {
	const ruleset = createRuleset();
	const plugin = referencePlugin();
	const actionSet = ReferenceCombatActionSet.create(BINDINGS, plugin.actions).getRight();
	const completion = ThresholdCombatCompletionRule.create(ruleset, ATTRIBUTE_DEFINITIONS).getRight();

	return {
		actionSet,
		completion,
		engine: new CombatEngine(CombatSetupMother.create({ actions: plugin, actionSet, completion, ruleset })),
		plugin,
		ruleset,
	};
}

function combatantPower(combat: Combat, combatantId: string): AttributeValue | undefined {
	return combat.groups
		.flatMap(group => group.combatants)
		.find(combatant => combatant.id === combatantId)
		?.attributes.toPrimitives()['power'];
}

function groupPower(combat: Combat, groupId: string): AttributeValue | undefined {
	return combat.groups.find(group => group.id === groupId)?.attributes.toPrimitives()['power'];
}

function combatPower(combat: Combat): AttributeValue | undefined {
	return combat.attributes.toPrimitives()['power'];
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
	it('hydrates the authored ruleset and builds the action set and completion rule', () => {
		const ruleset = createRuleset();

		expect(ruleset).toBeInstanceOf(OneVersusOneCombatRuleset);
		expect(ruleset.groupConstraints).toEqual(OneVersusOneCombatRuleset.CONSTRAINTS);

		const plugin = referencePlugin();
		const actionSetResult = ReferenceCombatActionSet.create(BINDINGS, plugin.actions);

		expect(actionSetResult.isRight()).toBe(true);

		const actionSet = actionSetResult.getRight();

		expect(actionSet.bindings).toHaveLength(2);
		expect(actionSet.find('move-1')?.actionId).toBe(MODIFY_ATTRIBUTE_ACTION_ID);
		expect(actionSet.find('move-1')?.config.toPrimitives()[REFERENCE_CONFIG_KEYS.scope]).toBe('combatant');
		expect(actionSet.find('move-2')?.config.toPrimitives()[REFERENCE_CONFIG_KEYS.scope]).toBe('group');
		expect(actionSet.find('move-2')?.config.toPrimitives()[REFERENCE_CONFIG_KEYS.probability]).toBe(1);

		const completion = ThresholdCombatCompletionRule.create(ruleset, ATTRIBUTE_DEFINITIONS);

		expect(completion.isRight()).toBe(true);
		expect(completion.getRight()).toBeInstanceOf(ThresholdCombatCompletionRule);
	});

	it('rejects an unknown target without mutating the initial combat', () => {
		const { engine } = compose();
		const combat = referenceCombat();
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
		const { engine } = compose();
		const combat = referenceCombat();
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
		expect(groupPower(firstResolution.combat, 'group-a')).toBe(45);
		expect(combatPower(firstResolution.combat)).toBe(50);
	});

	it('crosses the completion threshold with attributes at combat, group, and combatant level', () => {
		const { engine } = compose();
		const combat = referenceCombat();

		const moved = engine.resolve(combat, MOVE_2_INPUT);

		expect(moved.isRight()).toBe(true);

		const activeCombat = moved.getRight().combat;
		const before = activeCombat.toPrimitives();

		const result = engine.resolve(activeCombat, MOVE_1_INPUT);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();

		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
		expect(resolution.events.map(event => event.type)).toEqual(['attribute-modified', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(resolution.events[1]?.payload).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
		expect(combatantPower(resolution.combat, 'combatant-a')).toBe(5);
		expect(groupPower(resolution.combat, 'group-a')).toBe(45);
		expect(combatPower(resolution.combat)).toBe(50);
		expect(activeCombat.toPrimitives()).toEqual(before);
	});

	it('rejects a resolution after completion without producing a successor or events', () => {
		const { engine } = compose();
		const moved = engine.resolve(referenceCombat(), MOVE_2_INPUT).getRight();
		const completed = engine.resolve(moved.combat, MOVE_1_INPUT).getRight();
		const before = completed.combat.toPrimitives();

		const result = engine.resolve(completed.combat, MOVE_1_INPUT);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
		expect(completed.combat.toPrimitives()).toEqual(before);
	});
});
