import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { ThresholdCompletionConfig } from '@pocket-forge/combat-engine/rules';
import { COMPLETION_CONFIG_KEYS, ThresholdCombatCompletionRule } from '@pocket-forge/combat-engine/rules';
import { describe, expect, it } from 'bun:test';

import { builtInCombat, completionRule, DEFAULT_COMPLETION_ATTRIBUTES } from './rules.fixtures';

const BOUNDARY = 30;

function rule(overrides?: Partial<ThresholdCompletionConfig>): ThresholdCombatCompletionRule {
	return completionRule({
		...DEFAULT_COMPLETION_ATTRIBUTES,
		[COMPLETION_CONFIG_KEYS.attributeKey]: overrides?.attributeKey ?? 'power',
		[COMPLETION_CONFIG_KEYS.comparison]: overrides?.comparison ?? 'lte',
		[COMPLETION_CONFIG_KEYS.threshold]: overrides?.threshold ?? 10,
		[COMPLETION_CONFIG_KEYS.winnerPolicy]: overrides?.winnerPolicy ?? 'threshold-group',
	});
}

function withCombatantPower(
	combat: Combat,
	values: Record<string, AttributeValue>,
	missingCombatantId?: string
): Combat {
	const primitives = combat.toPrimitives();

	return CombatEntity.fromPrimitives({
		...primitives,
		groups: primitives.groups.map(group => ({
			...group,
			combatants: group.combatants.map(combatant => {
				const attributes = { ...combatant.attributes };

				if (combatant.id === missingCombatantId) {
					delete attributes['power'];
				}

				const value = values[combatant.id];

				if (value !== undefined) {
					attributes['power'] = value;
				}

				return { ...combatant, attributes };
			}),
		})),
	});
}

describe('ThresholdCombatCompletionRule.evaluateCompletion', () => {
	it('returns no outcome before the boundary', () => {
		const outcome = rule({ comparison: 'lt', threshold: BOUNDARY }).evaluateCompletion(builtInCombat());

		expect(outcome).toBeUndefined();
	});

	it('rewards the threshold group when it reaches an inclusive boundary', () => {
		const outcome = rule({
			comparison: 'lte',
			threshold: BOUNDARY,
			winnerPolicy: 'threshold-group',
		}).evaluateCompletion(builtInCombat());

		expect(outcome).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
	});

	it('rewards the opposing group when the threshold group reaches an inclusive boundary', () => {
		const outcome = rule({
			comparison: 'lte',
			threshold: BOUNDARY,
			winnerPolicy: 'opposing-group',
		}).evaluateCompletion(builtInCombat());

		expect(outcome).toEqual({ status: 'victory', winnerGroupId: 'group-b' });
	});

	it('rewards the threshold group when it exceeds an exclusive boundary', () => {
		const outcome = rule({
			comparison: 'gt',
			threshold: BOUNDARY,
			winnerPolicy: 'threshold-group',
		}).evaluateCompletion(builtInCombat());

		expect(outcome).toEqual({ status: 'victory', winnerGroupId: 'group-b' });
	});

	it('draws when both groups satisfy an inclusive boundary', () => {
		const combat = builtInCombat();

		expect(
			rule({ comparison: 'gte', threshold: BOUNDARY, winnerPolicy: 'threshold-group' }).evaluateCompletion(combat)
		).toEqual({ status: 'draw' });
		expect(
			rule({ comparison: 'gte', threshold: BOUNDARY, winnerPolicy: 'opposing-group' }).evaluateCompletion(combat)
		).toEqual({ status: 'draw' });
	});

	it('skips a combatant without the observed attribute', () => {
		const combat = withCombatantPower(builtInCombat(), { 'combatant-a': 5 }, 'combatant-b');
		const outcome = rule({ comparison: 'lte', threshold: 10 }).evaluateCompletion(combat);

		expect(outcome).toEqual({ status: 'victory', winnerGroupId: 'group-a' });
	});

	it('skips a non-numeric observed attribute value', () => {
		const combat = withCombatantPower(builtInCombat(), { 'combatant-a': 'high', 'combatant-b': 5 });
		const outcome = rule({ comparison: 'lte', threshold: 10 }).evaluateCompletion(combat);

		expect(outcome).toEqual({ status: 'victory', winnerGroupId: 'group-b' });
	});

	it('does not mutate the evaluated combat', () => {
		const combat = builtInCombat();
		const before = combat.toPrimitives();

		rule({ comparison: 'lte', threshold: BOUNDARY }).evaluateCompletion(combat);

		expect(combat.toPrimitives()).toEqual(before);
	});
});
