import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import type {
	CombatCompletionHook,
	CombatOutcome,
	CombatRuleData,
	CombatRulePrimitives,
} from '@pocket-forge/combat-engine/domain';
import { CombatRule } from '@pocket-forge/combat-engine/domain';

import ThresholdCombatCompletionRuleError from './threshold-combat-completion-rule.error';
import type { ThresholdCompletionConfig } from './threshold-completion.config';
import { COMPLETION_CONFIG_KEYS, readThresholdCompletionConfig } from './threshold-completion.config';

/**
 * Built-in completion rule that ends Combat from a Combatant attribute
 * threshold.
 *
 * The rule carries its own configuration. It evaluates the injected project
 * attribute catalog, returns a declarative outcome, and never mutates Combat or
 * resolves Moves. The engine owns the `completed` transition and the
 * completion event.
 */
class ThresholdCombatCompletionRule extends CombatRule implements CombatCompletionHook {
	private readonly config: ThresholdCompletionConfig;

	private constructor(data: CombatRuleData, config: ThresholdCompletionConfig) {
		super(data);
		this.config = config;
	}

	/**
	 * Reads the authored `completion.*` configuration from the rule primitives
	 * and resolves the observed attribute from the injected catalog.
	 *
	 * @param primitives - Serialized rule data carrying the completion config.
	 * @param definitions - Definitions that govern the completion config.
	 * @param attributeDefinitions - Project attribute catalog.
	 * @returns The configured rule, or every validation failure.
	 * @example
	 * ```ts
	 * const result = ThresholdCombatCompletionRule.create(
	 *   primitives,
	 *   COMPLETION_CONFIG_DEFINITIONS,
	 *   attributeDefinitions
	 * );
	 * ```
	 */
	static create(
		primitives: CombatRulePrimitives,
		definitions: readonly AttributeDefinition[],
		attributeDefinitions: readonly AttributeDefinition[]
	): Either<ThresholdCombatCompletionRuleError[], ThresholdCombatCompletionRule> {
		const validated = this.validate(primitives, definitions);

		if (validated.isLeft()) {
			return Either.left(
				validated
					.getLeft()
					.map(error => new ThresholdCombatCompletionRuleError('invalid-config', error.message, error.path))
			);
		}

		const data = validated.getRight();
		const config = readThresholdCompletionConfig(data.attributes.toPrimitives());

		if (config.isLeft()) {
			return Either.left(config.getLeft());
		}

		const parsed = config.getRight();
		const definition = attributeDefinitions.find(entry => entry.key === parsed.attributeKey);

		if (!definition) {
			return Either.left([
				new ThresholdCombatCompletionRuleError(
					'invalid-attribute',
					`Unknown combatant attribute "${parsed.attributeKey}"`,
					`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`
				),
			]);
		}

		if (definition.type !== 'number') {
			return Either.left([
				new ThresholdCombatCompletionRuleError(
					'invalid-attribute',
					`Combatant attribute "${parsed.attributeKey}" must be numeric`,
					`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`
				),
			]);
		}

		return Either.right(new ThresholdCombatCompletionRule(data, parsed));
	}

	/**
	 * Evaluates the configured attribute threshold.
	 *
	 * @param combat - Combat snapshot to evaluate. It is never mutated.
	 * @returns The reached outcome, or `undefined` while combat continues.
	 */
	evaluate(combat: Combat): CombatOutcome | undefined {
		const satisfying = combat.groups.filter(group =>
			group.combatants.some(combatant =>
				this.satisfies(combatant.attributes.toPrimitives()[this.config.attributeKey])
			)
		);

		if (satisfying.length === 0) {
			return undefined;
		}

		if (satisfying.length > 1) {
			return { status: 'draw' };
		}

		const [thresholdGroup] = satisfying;

		if (!thresholdGroup) {
			return undefined;
		}

		if (this.config.winnerPolicy === 'threshold-group') {
			return { status: 'victory', winnerGroupId: thresholdGroup.id };
		}

		const opposingGroup = combat.groups.find(group => group.id !== thresholdGroup.id);

		if (!opposingGroup) {
			return { status: 'draw' };
		}

		return { status: 'victory', winnerGroupId: opposingGroup.id };
	}

	private satisfies(value: AttributeValue | undefined): boolean {
		if (typeof value !== 'number') {
			return false;
		}

		switch (this.config.comparison) {
			case 'gt': {
				return value > this.config.threshold;
			}
			case 'gte': {
				return value >= this.config.threshold;
			}
			case 'lt': {
				return value < this.config.threshold;
			}
			case 'lte': {
				return value <= this.config.threshold;
			}
		}
	}
}

export default ThresholdCombatCompletionRule;
