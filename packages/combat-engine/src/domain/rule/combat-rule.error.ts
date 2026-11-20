import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Rule can be rejected.
 */
type CombatRuleErrorReason = 'invalid-attribute' | 'invalid-constraints';

/**
 * Structured rejection produced while validating a Combat Rule.
 *
 * Rules aggregate their errors, so a caller can report every problem at once.
 */
class CombatRuleError extends DomainError {
	/**
	 * Dot-separated path to the offending attribute or constraint.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatRuleErrorReason;

	constructor(reason: CombatRuleErrorReason, message: string, path?: string) {
		super('CombatRuleError', message, 'CRL(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatRuleErrorReason };
export default CombatRuleError;
