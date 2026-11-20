import Either from '@hexadrop/either';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

import ThresholdCombatCompletionRuleError from './threshold-combat-completion-rule.error';

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

/**
 * Comparison operators supported by the threshold completion rule.
 */
type CompletionComparison = (typeof COMPLETION_COMPARISONS)[number];
/**
 * Winner policies supported by the threshold completion rule.
 */
type CompletionWinnerPolicy = (typeof COMPLETION_WINNER_POLICIES)[number];

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

/**
 * Validated threshold completion configuration.
 *
 * Owns the configuration contract and the validation that produces it. The
 * factory returns an aggregated {@link Either}; failures are never thrown.
 */
class ThresholdCompletionConfig {
	/**
	 * Comparisons supported by the rule.
	 */
	static readonly COMPARISONS = COMPLETION_COMPARISONS;
	/**
	 * Definitions that govern the configuration values.
	 */
	static readonly DEFINITIONS = COMPLETION_CONFIG_DEFINITIONS;
	/**
	 * Keys authored on the rule.
	 */
	static readonly KEYS = COMPLETION_CONFIG_KEYS;
	/**
	 * Winner policies supported by the rule.
	 */
	static readonly WINNER_POLICIES = COMPLETION_WINNER_POLICIES;

	/**
	 * Combatant attribute observed by the rule.
	 */
	readonly attributeKey: string;
	/**
	 * Comparison applied between the observed value and the threshold.
	 */
	readonly comparison: CompletionComparison;
	/**
	 * Numeric boundary that triggers completion.
	 */
	readonly threshold: number;
	/**
	 * Group that wins when the threshold is satisfied.
	 */
	readonly winnerPolicy: CompletionWinnerPolicy;

	private constructor(data: {
		readonly attributeKey: string;
		readonly comparison: CompletionComparison;
		readonly threshold: number;
		readonly winnerPolicy: CompletionWinnerPolicy;
	}) {
		this.attributeKey = data.attributeKey;
		this.comparison = data.comparison;
		this.threshold = data.threshold;
		this.winnerPolicy = data.winnerPolicy;
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
	static create(
		attributes: AttributeValues
	): Either<ThresholdCombatCompletionRuleError[], ThresholdCompletionConfig> {
		const errors = this.DEFINITIONS.flatMap(definition => this.validateValue(attributes, definition));

		if (errors.length > 0) {
			return Either.left(errors);
		}

		const attributeKey = attributes[this.KEYS.attributeKey];
		const comparison = attributes[this.KEYS.comparison];
		const threshold = attributes[this.KEYS.threshold];
		const winnerPolicy = attributes[this.KEYS.winnerPolicy];

		if (
			typeof attributeKey !== 'string' ||
			typeof threshold !== 'number' ||
			!Number.isFinite(threshold) ||
			!this.isComparison(comparison) ||
			!this.isWinnerPolicy(winnerPolicy)
		) {
			return Either.left([
				new ThresholdCombatCompletionRuleError(
					'invalid-config',
					'Completion configuration is incomplete',
					'attributes'
				),
			]);
		}

		return Either.right(new ThresholdCompletionConfig({ attributeKey, comparison, threshold, winnerPolicy }));
	}

	/**
	 * Narrows a value to a supported comparison.
	 *
	 * @param value - Value to inspect.
	 * @returns Whether the value is a supported comparison.
	 */
	static isComparison(value: unknown): value is CompletionComparison {
		return typeof value === 'string' && (COMPLETION_COMPARISONS as readonly string[]).includes(value);
	}

	/**
	 * Narrows a value to a supported winner policy.
	 *
	 * @param value - Value to inspect.
	 * @returns Whether the value is a supported winner policy.
	 */
	static isWinnerPolicy(value: unknown): value is CompletionWinnerPolicy {
		return typeof value === 'string' && (COMPLETION_WINNER_POLICIES as readonly string[]).includes(value);
	}

	private static path(key: string): string {
		return `attributes.${key}`;
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
	private static validateValue(
		attributes: AttributeValues,
		definition: AttributeDefinition
	): ThresholdCombatCompletionRuleError[] {
		const raw = attributes[definition.key];
		const path = this.path(definition.key);

		if (raw === undefined) {
			return definition.required
				? [
						new ThresholdCombatCompletionRuleError(
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
				new ThresholdCombatCompletionRuleError(
					'invalid-config',
					`Invalid value for attribute "${definition.key}": ${error.message}`,
					path
				),
			];
		}

		if (typeof raw === 'number' && !Number.isFinite(raw)) {
			return [
				new ThresholdCombatCompletionRuleError(
					'invalid-config',
					`Attribute "${definition.key}" must be a finite number`,
					path
				),
			];
		}

		return [];
	}
}

export type { CompletionComparison, CompletionWinnerPolicy };
export { COMPLETION_COMPARISONS, COMPLETION_CONFIG_DEFINITIONS, COMPLETION_CONFIG_KEYS, COMPLETION_WINNER_POLICIES };
export default ThresholdCompletionConfig;
