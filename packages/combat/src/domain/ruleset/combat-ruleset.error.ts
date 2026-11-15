import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Ruleset can fail validation.
 */
type CombatRulesetErrorReason =
	'invalid-attribute' | 'invalid-constraints' | 'invalid-id' | 'invalid-kind' | 'invalid-name' | 'invalid-version';

/**
 * Structured validation failure for an authored Combat Ruleset.
 *
 * Errors are aggregated by the ruleset validator instead of thrown, so
 * callers can report every problem at once.
 */
class CombatRulesetError extends DomainError {
	/**
	 * Optional dot-separated path to the offending primitive or group.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatRulesetErrorReason;

	constructor(reason: CombatRulesetErrorReason, message: string, path?: string) {
		super('CombatRulesetError', message, 'CRS(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatRulesetErrorReason };
export default CombatRulesetError;
