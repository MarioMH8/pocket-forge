import type { AttributeValues } from '@pocket-forge/attribute/domain';
import {
	COMPLETION_CONFIG_KEYS,
	readThresholdCompletionConfig,
	ThresholdCombatCompletionRule,
} from '@pocket-forge/combat-reference/domain';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS, completionRuleset, DEFAULT_COMPLETION_ATTRIBUTES } from '../support/reference.fixtures';

function attributes(overrides?: AttributeValues): AttributeValues {
	return { ...DEFAULT_COMPLETION_ATTRIBUTES, ...overrides };
}

function without(key: string): AttributeValues {
	return Object.fromEntries(Object.entries(DEFAULT_COMPLETION_ATTRIBUTES).filter(([entryKey]) => entryKey !== key));
}

describe('readThresholdCompletionConfig', () => {
	it('accepts a complete configuration and ignores non-completion attributes', () => {
		const result = readThresholdCompletionConfig(attributes({ 'unrelated.key': 'ignored' }));

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toEqual({
			attributeKey: 'power',
			comparison: 'lte',
			threshold: 10,
			winnerPolicy: 'threshold-group',
		});
	});

	it('rejects a missing attribute key', () => {
		const result = readThresholdCompletionConfig(without(COMPLETION_CONFIG_KEYS.attributeKey));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`);
	});

	it('rejects a missing comparison', () => {
		const result = readThresholdCompletionConfig(without(COMPLETION_CONFIG_KEYS.comparison));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.comparison}`);
	});

	it('rejects a missing threshold', () => {
		const result = readThresholdCompletionConfig(without(COMPLETION_CONFIG_KEYS.threshold));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.threshold}`);
	});

	it('rejects a missing winner policy', () => {
		const result = readThresholdCompletionConfig(without(COMPLETION_CONFIG_KEYS.winnerPolicy));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.winnerPolicy}`);
	});

	it('rejects an invalid comparison', () => {
		const result = readThresholdCompletionConfig(attributes({ [COMPLETION_CONFIG_KEYS.comparison]: 'eq' }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-comparison');
	});

	it('rejects an invalid winner policy', () => {
		const result = readThresholdCompletionConfig(
			attributes({ [COMPLETION_CONFIG_KEYS.winnerPolicy]: 'first-group' })
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-winner-policy');
	});

	it('rejects an infinite threshold', () => {
		const result = readThresholdCompletionConfig(attributes({ [COMPLETION_CONFIG_KEYS.threshold]: Infinity }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-threshold');
	});

	it('rejects a NaN threshold', () => {
		const result = readThresholdCompletionConfig(attributes({ [COMPLETION_CONFIG_KEYS.threshold]: NaN }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-threshold');
	});

	it('aggregates every invalid completion value', () => {
		const result = readThresholdCompletionConfig({
			[COMPLETION_CONFIG_KEYS.attributeKey]: '',
			[COMPLETION_CONFIG_KEYS.comparison]: 'eq',
			[COMPLETION_CONFIG_KEYS.threshold]: NaN,
			[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'first-group',
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual([
			'invalid-attribute',
			'invalid-comparison',
			'invalid-threshold',
			'invalid-winner-policy',
		]);
	});
});

describe('ThresholdCombatCompletionRule.create', () => {
	it('declares its kind and contract version', () => {
		expect(ThresholdCombatCompletionRule.KIND).toBe('threshold');
		expect(ThresholdCombatCompletionRule.VERSION).toBe('1.0.0');
	});

	it('produces a rule from valid ruleset attributes', () => {
		const result = ThresholdCombatCompletionRule.create(completionRuleset(), ATTRIBUTE_DEFINITIONS);

		expect(result.isRight()).toBe(true);

		const rule = result.getRight();
		expect(rule).toBeInstanceOf(ThresholdCombatCompletionRule);
		expect(rule.kind).toBe('threshold');
		expect(rule.contractVersion).toBe('1.0.0');
	});

	it('rejects an unknown observed attribute key', () => {
		const result = ThresholdCombatCompletionRule.create(
			completionRuleset(attributes({ [COMPLETION_CONFIG_KEYS.attributeKey]: 'unknown' })),
			ATTRIBUTE_DEFINITIONS
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`);
	});

	it('rejects a non-numeric observed attribute definition', () => {
		const result = ThresholdCombatCompletionRule.create(
			completionRuleset(attributes({ [COMPLETION_CONFIG_KEYS.attributeKey]: 'banner' })),
			ATTRIBUTE_DEFINITIONS
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
		expect(result.getLeft()[0]?.message).toContain('must be numeric');
	});
});
