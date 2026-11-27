import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { CombatOutcome } from '@pocket-forge/combat-engine/domain';
import type { ThresholdCompletionConfig } from '@pocket-forge/combat-engine/rules';
import { COMPLETION_CONFIG_KEYS, ThresholdCombatCompletionRule } from '@pocket-forge/combat-engine/rules';
import { describe, expect, it } from 'bun:test';

import { DEFAULT_COMPLETION_ATTRIBUTES, RulesFixture } from './rules.fixtures';

const BOUNDARY = 30;

class CompletionFixture {
	static rule(overrides?: Partial<ThresholdCompletionConfig>): ThresholdCombatCompletionRule {
		return RulesFixture.completionRule({
			...DEFAULT_COMPLETION_ATTRIBUTES,
			[COMPLETION_CONFIG_KEYS.attributeKey]: overrides?.attributeKey ?? 'power',
			[COMPLETION_CONFIG_KEYS.comparison]: overrides?.comparison ?? 'lte',
			[COMPLETION_CONFIG_KEYS.threshold]: overrides?.threshold ?? 10,
			[COMPLETION_CONFIG_KEYS.winnerPolicy]: overrides?.winnerPolicy ?? 'threshold-group',
		});
	}

	static withCombatantPower(
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
}

describe('ThresholdCombatCompletionRule.evaluateCompletion', () => {
	it('returns no outcome before the boundary', () => {
		const outcome = CompletionFixture.rule({ comparison: 'lt', threshold: BOUNDARY }).evaluateCompletion(
			RulesFixture.builtInCombat()
		);

		expect(outcome).toBeUndefined();
	});

	it('rewards the threshold group when it reaches an inclusive boundary', () => {
		const outcome = CompletionFixture.rule({
			comparison: 'lte',
			threshold: BOUNDARY,
			winnerPolicy: 'threshold-group',
		}).evaluateCompletion(RulesFixture.builtInCombat());

		expect(outcome).toEqual(CombatOutcome.victory('group-a'));
	});

	it('rewards the opposing group when the threshold group reaches an inclusive boundary', () => {
		const outcome = CompletionFixture.rule({
			comparison: 'lte',
			threshold: BOUNDARY,
			winnerPolicy: 'opposing-group',
		}).evaluateCompletion(RulesFixture.builtInCombat());

		expect(outcome).toEqual(CombatOutcome.victory('group-b'));
	});

	it('rewards the threshold group when it exceeds an exclusive boundary', () => {
		const outcome = CompletionFixture.rule({
			comparison: 'gt',
			threshold: BOUNDARY,
			winnerPolicy: 'threshold-group',
		}).evaluateCompletion(RulesFixture.builtInCombat());

		expect(outcome).toEqual(CombatOutcome.victory('group-b'));
	});

	it('draws when both groups satisfy an inclusive boundary', () => {
		const combat = RulesFixture.builtInCombat();

		expect(
			CompletionFixture.rule({
				comparison: 'gte',
				threshold: BOUNDARY,
				winnerPolicy: 'threshold-group',
			}).evaluateCompletion(combat)
		).toEqual(CombatOutcome.draw());
		expect(
			CompletionFixture.rule({
				comparison: 'gte',
				threshold: BOUNDARY,
				winnerPolicy: 'opposing-group',
			}).evaluateCompletion(combat)
		).toEqual(CombatOutcome.draw());
	});

	it('skips a combatant without the observed attribute', () => {
		const combat = CompletionFixture.withCombatantPower(
			RulesFixture.builtInCombat(),
			{ 'combatant-a': 5 },
			'combatant-b'
		);
		const outcome = CompletionFixture.rule({ comparison: 'lte', threshold: 10 }).evaluateCompletion(combat);

		expect(outcome).toEqual(CombatOutcome.victory('group-a'));
	});

	it('skips a non-numeric observed attribute value', () => {
		const combat = CompletionFixture.withCombatantPower(RulesFixture.builtInCombat(), {
			'combatant-a': 'high',
			'combatant-b': 5,
		});
		const outcome = CompletionFixture.rule({ comparison: 'lte', threshold: 10 }).evaluateCompletion(combat);

		expect(outcome).toEqual(CombatOutcome.victory('group-b'));
	});

	it('does not mutate the evaluated combat', () => {
		const combat = RulesFixture.builtInCombat();
		const before = combat.toPrimitives();

		CompletionFixture.rule({ comparison: 'lte', threshold: BOUNDARY }).evaluateCompletion(combat);

		expect(combat.toPrimitives()).toEqual(before);
	});
});
