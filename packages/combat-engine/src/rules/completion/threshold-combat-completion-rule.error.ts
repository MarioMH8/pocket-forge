import DomainError from '@hexadrop/error';

/**
 * Reasons a threshold Combat Completion Rule can fail validation.
 */
type ThresholdCombatCompletionRuleErrorReason = 'invalid-attribute' | 'invalid-config';

/**
 * Structured validation failure for a threshold Combat Completion Rule.
 *
 * Failures are aggregated instead of thrown so callers can report every
 * authored `completion.*` problem at once.
 */
class ThresholdCombatCompletionRuleError extends DomainError {
	/**
	 * Optional dot-separated path to the offending configuration value.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: ThresholdCombatCompletionRuleErrorReason;

	constructor(reason: ThresholdCombatCompletionRuleErrorReason, message: string, path?: string) {
		super('ThresholdCombatCompletionRuleError', message, 'CCR(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { ThresholdCombatCompletionRuleErrorReason };
export default ThresholdCombatCompletionRuleError;
