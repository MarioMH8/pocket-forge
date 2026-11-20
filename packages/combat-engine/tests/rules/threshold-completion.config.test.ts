import type { AttributeValues } from '@pocket-forge/attribute/domain';
import {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	ThresholdCombatCompletionRule,
	ThresholdCompletionConfig,
} from '@pocket-forge/combat-engine/rules';
import { describe, expect, it } from 'bun:test';

import { ATTRIBUTE_DEFINITIONS, DEFAULT_COMPLETION_ATTRIBUTES } from './rules.fixtures';

function attributes(overrides?: AttributeValues): AttributeValues {
	return { ...DEFAULT_COMPLETION_ATTRIBUTES, ...overrides };
}

function without(key: string): AttributeValues {
	return Object.fromEntries(Object.entries(DEFAULT_COMPLETION_ATTRIBUTES).filter(([entryKey]) => entryKey !== key));
}

describe('ThresholdCompletionConfig.create', () => {
	it('accepts a complete configuration and ignores non-completion attributes', () => {
		const result = ThresholdCompletionConfig.create(attributes({ 'unrelated.key': 'ignored' }));

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toMatchObject({
			attributeKey: 'power',
			comparison: 'lte',
			threshold: 10,
			winnerPolicy: 'threshold-group',
		});
	});

	it('rejects a missing attribute key', () => {
		const result = ThresholdCompletionConfig.create(without(COMPLETION_CONFIG_KEYS.attributeKey));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`);
	});

	it('rejects a missing comparison', () => {
		const result = ThresholdCompletionConfig.create(without(COMPLETION_CONFIG_KEYS.comparison));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.comparison}`);
	});

	it('rejects a missing threshold', () => {
		const result = ThresholdCompletionConfig.create(without(COMPLETION_CONFIG_KEYS.threshold));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.threshold}`);
	});

	it('rejects a missing winner policy', () => {
		const result = ThresholdCompletionConfig.create(without(COMPLETION_CONFIG_KEYS.winnerPolicy));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.winnerPolicy}`);
	});

	it('rejects an invalid comparison', () => {
		const result = ThresholdCompletionConfig.create(attributes({ [COMPLETION_CONFIG_KEYS.comparison]: 'eq' }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.comparison}`);
	});

	it('rejects an invalid winner policy', () => {
		const result = ThresholdCompletionConfig.create(
			attributes({ [COMPLETION_CONFIG_KEYS.winnerPolicy]: 'first-group' })
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.winnerPolicy}`);
	});

	it('rejects an infinite threshold', () => {
		const result = ThresholdCompletionConfig.create(attributes({ [COMPLETION_CONFIG_KEYS.threshold]: Infinity }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.threshold}`);
	});

	it('rejects a NaN threshold', () => {
		const result = ThresholdCompletionConfig.create(attributes({ [COMPLETION_CONFIG_KEYS.threshold]: NaN }));

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.threshold}`);
	});

	it('aggregates every invalid completion value', () => {
		const result = ThresholdCompletionConfig.create({
			[COMPLETION_CONFIG_KEYS.attributeKey]: '',
			[COMPLETION_CONFIG_KEYS.comparison]: 'eq',
			[COMPLETION_CONFIG_KEYS.threshold]: NaN,
			[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'first-group',
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.path)).toEqual([
			`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`,
			`attributes.${COMPLETION_CONFIG_KEYS.comparison}`,
			`attributes.${COMPLETION_CONFIG_KEYS.threshold}`,
			`attributes.${COMPLETION_CONFIG_KEYS.winnerPolicy}`,
		]);
	});
});

describe('ThresholdCombatCompletionRule.create', () => {
	it('produces a rule from valid completion primitives', () => {
		const result = ThresholdCombatCompletionRule.create(
			{ attributes: { ...DEFAULT_COMPLETION_ATTRIBUTES } },
			COMPLETION_CONFIG_DEFINITIONS,
			ATTRIBUTE_DEFINITIONS
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toBeInstanceOf(ThresholdCombatCompletionRule);
	});

	it('rejects an unknown observed attribute key', () => {
		const result = ThresholdCombatCompletionRule.create(
			{ attributes: attributes({ [COMPLETION_CONFIG_KEYS.attributeKey]: 'unknown' }) },
			COMPLETION_CONFIG_DEFINITIONS,
			ATTRIBUTE_DEFINITIONS
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
		expect(result.getLeft()[0]?.path).toBe(`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`);
	});

	it('rejects a non-numeric observed attribute definition', () => {
		const result = ThresholdCombatCompletionRule.create(
			{ attributes: attributes({ [COMPLETION_CONFIG_KEYS.attributeKey]: 'banner' }) },
			COMPLETION_CONFIG_DEFINITIONS,
			ATTRIBUTE_DEFINITIONS
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-attribute');
		expect(result.getLeft()[0]?.message).toContain('must be numeric');
	});
});
