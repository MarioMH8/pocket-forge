import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type { CombatCompletionRule, CombatRuleset } from '@pocket-forge/combat/domain';

import ReferenceCombatCompletionRuleError from './reference-completion-rule.error';
import ThresholdCombatCompletionRule from './threshold-combat-completion-rule';

/**
 * Hydrates reference Combat Completion Rules by `kind`.
 *
 * The factory injects the project attribute catalog so concrete rules can
 * validate the Combatant attribute they observe.
 */
class ReferenceCombatCompletionRuleFactory {
	private readonly attributeDefinitions: readonly AttributeDefinition[];

	constructor(attributeDefinitions: readonly AttributeDefinition[]) {
		this.attributeDefinitions = attributeDefinitions;
	}

	/**
	 * Builds the completion rule declared by `kind`.
	 *
	 * @param kind - Stable completion-rule kind identifier.
	 * @param ruleset - Ruleset that carries the authored completion attributes.
	 * @returns The configured rule, or the unknown kind failure.
	 */
	create(kind: string, ruleset: CombatRuleset): Either<ReferenceCombatCompletionRuleError[], CombatCompletionRule> {
		switch (kind) {
			case ThresholdCombatCompletionRule.KIND: {
				return ThresholdCombatCompletionRule.create(ruleset, this.attributeDefinitions);
			}
			default: {
				return Either.left([
					new ReferenceCombatCompletionRuleError(
						'unknown-kind',
						`Unknown reference combat completion rule kind "${kind}"`,
						'kind'
					),
				]);
			}
		}
	}
}

export default ReferenceCombatCompletionRuleFactory;
