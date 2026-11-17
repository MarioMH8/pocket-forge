import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValue } from '@pocket-forge/attribute/domain';
import type { Combat, CombatCompletionRule, CombatOutcome, CombatRuleset } from '@pocket-forge/combat/domain';

import ReferenceCombatCompletionRuleError from './reference-completion-rule.error';
import type { ThresholdCompletionConfig } from './threshold-completion.config';
import { COMPLETION_CONFIG_KEYS, readThresholdCompletionConfig } from './threshold-completion.config';

/**
 * Reference completion rule that ends Combat from a Combatant attribute
 * threshold.
 *
 * It evaluates the injected project attribute catalog, returns a declarative
 * outcome, and never mutates Combat or resolves Moves. The engine owns the
 * `completed` transition and its completion event.
 */
class ThresholdCombatCompletionRule implements CombatCompletionRule {
	/**
	 * Stable completion-rule kind identifier.
	 */
	static readonly KIND = 'threshold';
	/**
	 * Exact contract version of this completion rule.
	 */
	static readonly VERSION = '1.0.0';

	/**
	 * Exact contract version declared by this completion rule.
	 */
	readonly contractVersion = ThresholdCombatCompletionRule.VERSION;
	/**
	 * Stable completion-rule kind identifier.
	 */
	readonly kind = ThresholdCombatCompletionRule.KIND;
	private readonly config: ThresholdCompletionConfig;

	private constructor(config: ThresholdCompletionConfig) {
		this.config = config;
	}

	/**
	 * Reads the authored `completion.*` configuration and resolves the observed
	 * attribute definition from the injected catalog.
	 *
	 * @param ruleset - Ruleset that carries the authored completion attributes.
	 * @param attributeDefinitions - Project attribute catalog.
	 * @returns The configured rule, or every validation failure.
	 */
	static create(
		ruleset: CombatRuleset,
		attributeDefinitions: readonly AttributeDefinition[]
	): Either<ReferenceCombatCompletionRuleError[], ThresholdCombatCompletionRule> {
		const config = readThresholdCompletionConfig(ruleset.attributes.toPrimitives());

		if (config.isLeft()) {
			return Either.left(config.getLeft());
		}

		const parsed = config.getRight();
		const definition = attributeDefinitions.find(entry => entry.key === parsed.attributeKey);

		if (!definition) {
			return Either.left([
				new ReferenceCombatCompletionRuleError(
					'invalid-attribute',
					`Unknown combatant attribute "${parsed.attributeKey}"`,
					`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`
				),
			]);
		}

		if (definition.type !== 'number') {
			return Either.left([
				new ReferenceCombatCompletionRuleError(
					'invalid-attribute',
					`Combatant attribute "${parsed.attributeKey}" must be numeric`,
					`attributes.${COMPLETION_CONFIG_KEYS.attributeKey}`
				),
			]);
		}

		return Either.right(new ThresholdCombatCompletionRule(parsed));
	}

	/**
	 * Evaluates the configured attribute threshold against each Combatant Group.
	 *
	 * @param combat - Combat snapshot to inspect. It is never mutated.
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

		const opponent = combat.groups.find(group => group.id !== thresholdGroup.id);

		return opponent ? { status: 'victory', winnerGroupId: opponent.id } : { status: 'draw' };
	}

	private satisfies(raw: AttributeValue | undefined): boolean {
		if (typeof raw !== 'number') {
			return false;
		}

		const { comparison, threshold } = this.config;

		switch (comparison) {
			case 'gt': {
				return raw > threshold;
			}
			case 'gte': {
				return raw >= threshold;
			}
			case 'lt': {
				return raw < threshold;
			}
			case 'lte': {
				return raw <= threshold;
			}
		}
	}
}

export default ThresholdCombatCompletionRule;
