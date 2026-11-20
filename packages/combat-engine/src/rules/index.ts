export { default as OneVersusOneCombatRule } from './one-versus-one-combat.rule';
export { default as ThresholdCombatCompletionRule } from './threshold-combat-completion-rule';
export type { ThresholdCombatCompletionRuleErrorReason } from './threshold-combat-completion-rule.error';
export { default as ThresholdCombatCompletionRuleError } from './threshold-combat-completion-rule.error';
export type {
	CompletionComparison,
	CompletionWinnerPolicy,
	ThresholdCompletionConfig,
} from './threshold-completion.config';
export {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	readThresholdCompletionConfig,
} from './threshold-completion.config';
export { default as TwoVersusTwoCombatRule } from './two-versus-two-combat.rule';
