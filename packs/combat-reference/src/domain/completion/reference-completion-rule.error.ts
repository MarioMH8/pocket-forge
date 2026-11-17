import DomainError from '@hexadrop/error';

/**
 * Reasons a reference Combat Completion Rule can fail validation.
 */
type ReferenceCombatCompletionRuleErrorReason =
	| 'invalid-attribute'
	| 'invalid-comparison'
	| 'invalid-config'
	| 'invalid-threshold'
	| 'invalid-winner-policy'
	| 'unknown-kind';

/**
 * Structured validation failure for a reference Combat Completion Rule.
 *
 * Failures are aggregated instead of thrown so callers can report every
 * authored `completion.*` problem at once.
 */
class ReferenceCombatCompletionRuleError extends DomainError {
	/**
	 * Optional dot-separated path to the offending configuration value.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: ReferenceCombatCompletionRuleErrorReason;

	constructor(reason: ReferenceCombatCompletionRuleErrorReason, message: string, path?: string) {
		super('ReferenceCombatCompletionRuleError', message, 'CCR(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { ReferenceCombatCompletionRuleErrorReason };
export default ReferenceCombatCompletionRuleError;
