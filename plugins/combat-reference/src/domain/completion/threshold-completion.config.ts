import Either from '@hexadrop/either';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

import type { ReferenceCombatCompletionRuleErrorReason } from './reference-completion-rule.error';
import ReferenceCombatCompletionRuleError from './reference-completion-rule.error';

/**
 * Configuration keys authored on a threshold completion rule.
 */
const COMPLETION_CONFIG_KEYS = {
	attributeKey: 'completion.attributeKey',
	comparison: 'completion.comparison',
	threshold: 'completion.threshold',
	winnerPolicy: 'completion.winnerPolicy',
} as const;

/**
 * Comparisons supported by the threshold completion rule.
 */
const COMPLETION_COMPARISONS = ['lt', 'lte', 'gt', 'gte'] as const;

/**
 * Winner policies supported by the threshold completion rule.
 */
const COMPLETION_WINNER_POLICIES = ['threshold-group', 'opposing-group'] as const;

type CompletionComparison = (typeof COMPLETION_COMPARISONS)[number];
type CompletionWinnerPolicy = (typeof COMPLETION_WINNER_POLICIES)[number];

interface ThresholdCompletionConfig {
	readonly attributeKey: string;
	readonly comparison: CompletionComparison;
	readonly threshold: number;
	readonly winnerPolicy: CompletionWinnerPolicy;
}

const COMPLETION_ATTRIBUTE_KEY_DEFINITION = AttributeDefinition.create({
	constraints: { minLength: 1 },
	key: COMPLETION_CONFIG_KEYS.attributeKey,
	required: true,
	type: 'string',
});

const COMPLETION_COMPARISON_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...COMPLETION_COMPARISONS] },
	key: COMPLETION_CONFIG_KEYS.comparison,
	required: true,
	type: 'enum',
});

const COMPLETION_THRESHOLD_DEFINITION = AttributeDefinition.create({
	constraints: {},
	key: COMPLETION_CONFIG_KEYS.threshold,
	required: true,
	type: 'number',
});

const COMPLETION_WINNER_POLICY_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...COMPLETION_WINNER_POLICIES] },
	key: COMPLETION_CONFIG_KEYS.winnerPolicy,
	required: true,
	type: 'enum',
});

/**
 * Definitions that govern threshold completion configuration values.
 */
const COMPLETION_CONFIG_DEFINITIONS: readonly AttributeDefinition[] = [
	COMPLETION_ATTRIBUTE_KEY_DEFINITION,
	COMPLETION_COMPARISON_DEFINITION,
	COMPLETION_THRESHOLD_DEFINITION,
	COMPLETION_WINNER_POLICY_DEFINITION,
];

const COMPLETION_CONFIG_REASONS: Record<string, ReferenceCombatCompletionRuleErrorReason> = {
	[COMPLETION_CONFIG_KEYS.attributeKey]: 'invalid-attribute',
	[COMPLETION_CONFIG_KEYS.comparison]: 'invalid-comparison',
	[COMPLETION_CONFIG_KEYS.threshold]: 'invalid-threshold',
	[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'invalid-winner-policy',
};

function completionConfigPath(key: string): string {
	return `attributes.${key}`;
}

function isCompletionComparison(value: unknown): value is CompletionComparison {
	return typeof value === 'string' && (COMPLETION_COMPARISONS as readonly string[]).includes(value);
}

function isCompletionWinnerPolicy(value: unknown): value is CompletionWinnerPolicy {
	return typeof value === 'string' && (COMPLETION_WINNER_POLICIES as readonly string[]).includes(value);
}

function reasonFor(key: string): ReferenceCombatCompletionRuleErrorReason {
	return COMPLETION_CONFIG_REASONS[key] ?? 'invalid-config';
}

/**
 * Validates one authored `completion.*` value against its definition.
 *
 * Missing required keys and definition violations are reported as structured
 * failures instead of thrown, and non-finite thresholds are rejected here
 * because the shared number validator accepts `Infinity`.
 *
 * @param attributes - Authored ruleset attributes.
 * @param definition - Completion definition that governs the value.
 * @returns Every violation for this definition, or an empty list.
 */
function validateCompletionValue(
	attributes: AttributeValues,
	definition: AttributeDefinition
): ReferenceCombatCompletionRuleError[] {
	const raw = attributes[definition.key];
	const path = completionConfigPath(definition.key);

	if (raw === undefined) {
		return definition.required
			? [
					new ReferenceCombatCompletionRuleError(
						'invalid-config',
						`Attribute "${definition.key}" is required`,
						path
					),
				]
			: [];
	}

	const error = definition.validateValue(raw);

	if (error) {
		return [
			new ReferenceCombatCompletionRuleError(
				reasonFor(definition.key),
				`Invalid value for attribute "${definition.key}": ${error.message}`,
				path
			),
		];
	}

	if (typeof raw === 'number' && !Number.isFinite(raw)) {
		return [
			new ReferenceCombatCompletionRuleError(
				'invalid-threshold',
				`Attribute "${definition.key}" must be a finite number`,
				path
			),
		];
	}

	return [];
}

/**
 * Reads and validates threshold completion configuration from ruleset
 * attributes.
 *
 * Only `completion.*` keys are inspected; every other ruleset attribute is
 * ignored. Failures are aggregated so authored content can report every
 * problem at once.
 *
 * @param attributes - Authored ruleset attributes.
 * @returns The validated configuration, or every validation failure.
 */
function readThresholdCompletionConfig(
	attributes: AttributeValues
): Either<ReferenceCombatCompletionRuleError[], ThresholdCompletionConfig> {
	const errors = COMPLETION_CONFIG_DEFINITIONS.flatMap(definition => validateCompletionValue(attributes, definition));

	if (errors.length > 0) {
		return Either.left(errors);
	}

	const attributeKey = attributes[COMPLETION_CONFIG_KEYS.attributeKey];
	const comparison = attributes[COMPLETION_CONFIG_KEYS.comparison];
	const threshold = attributes[COMPLETION_CONFIG_KEYS.threshold];
	const winnerPolicy = attributes[COMPLETION_CONFIG_KEYS.winnerPolicy];

	if (
		typeof attributeKey !== 'string' ||
		typeof threshold !== 'number' ||
		!Number.isFinite(threshold) ||
		!isCompletionComparison(comparison) ||
		!isCompletionWinnerPolicy(winnerPolicy)
	) {
		return Either.left([
			new ReferenceCombatCompletionRuleError(
				'invalid-config',
				'Completion configuration is incomplete',
				'attributes'
			),
		]);
	}

	return Either.right({ attributeKey, comparison, threshold, winnerPolicy });
}

export type { CompletionComparison, CompletionWinnerPolicy, ThresholdCompletionConfig };
export {
	COMPLETION_COMPARISONS,
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	COMPLETION_WINNER_POLICIES,
	isCompletionComparison,
	isCompletionWinnerPolicy,
	readThresholdCompletionConfig,
};
