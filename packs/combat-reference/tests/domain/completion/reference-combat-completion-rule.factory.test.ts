import {
	ReferenceCombatCompletionRuleFactory,
	ThresholdCombatCompletionRule,
} from '@pocket-forge/combat-reference/domain';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS, completionRuleset } from '../support/reference.fixtures';

describe('ReferenceCombatCompletionRuleFactory', () => {
	const factory = new ReferenceCombatCompletionRuleFactory(ATTRIBUTE_DEFINITIONS);

	it('builds the threshold completion rule by kind', () => {
		const result = factory.create(ThresholdCombatCompletionRule.KIND, completionRuleset());

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(ThresholdCombatCompletionRule);
	});

	it('rejects an unknown kind', () => {
		const result = factory.create('last-standing', completionRuleset());

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('unknown-kind');
		expect(result.getLeft()[0]?.path).toBe('kind');
		expect(result.getLeft()[0]?.message).toContain('last-standing');
	});
});
