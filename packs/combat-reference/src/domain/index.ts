export type { ReferenceOperation, ReferenceTargetScope } from './action/modify-attribute.config';
export {
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	REFERENCE_CONFIG_KEYS,
	REFERENCE_OPERATIONS,
	REFERENCE_SCOPES,
	validateModifyAttributeConfig,
} from './action/modify-attribute.config';
export {
	MODIFY_ATTRIBUTE_DESCRIPTOR,
	default as ReferenceCombatActionCatalog,
} from './action/reference-combat.catalog';
export {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_PLUGIN_CONTRACT_RANGE,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
} from './action/reference-combat.constants';
export type { ReferenceCombatInput, ReferenceCombatTarget } from './action/reference-combat.input';
export { default as ReferenceCombatPlugin } from './action/reference-combat.plugin';
export { default as ReferenceCombatActionSet } from './action/reference-combat-action-set';
export { default as ReferenceCombatCompletionRuleFactory } from './completion/reference-combat-completion-rule.factory';
export type { ReferenceCombatCompletionRuleErrorReason } from './completion/reference-completion-rule.error';
export { default as ReferenceCombatCompletionRuleError } from './completion/reference-completion-rule.error';
export { default as ThresholdCombatCompletionRule } from './completion/threshold-combat-completion-rule';
export type {
	CompletionComparison,
	CompletionWinnerPolicy,
	ThresholdCompletionConfig,
} from './completion/threshold-completion.config';
export {
	COMPLETION_COMPARISONS,
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	COMPLETION_WINNER_POLICIES,
	isCompletionComparison,
	isCompletionWinnerPolicy,
	readThresholdCompletionConfig,
} from './completion/threshold-completion.config';
export { default as OneVersusOneCombatRuleset } from './ruleset/one-versus-one-combat.ruleset';
export { default as ReferenceCombatRulesetFactory } from './ruleset/reference-combat-ruleset.factory';
export { default as TwoVersusTwoCombatRuleset } from './ruleset/two-versus-two-combat.ruleset';
