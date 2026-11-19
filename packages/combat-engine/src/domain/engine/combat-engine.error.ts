import DomainError from '@hexadrop/error';

/**
 * Reasons the Combat Engine can reject a resolution before or after the
 * action plugin runs.
 */
type CombatEngineErrorReason = 'combat-not-active' | 'invalid-outcome' | 'invalid-transition';

/**
 * Structured rejection produced by the Combat Engine.
 *
 * The engine returns these values instead of throwing, so a rejected
 * resolution yields no successor, no events, and consumes no randomness.
 */
class CombatEngineError extends DomainError {
	/**
	 * Optional dot-separated path to the offending composition element.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatEngineErrorReason;

	constructor(reason: CombatEngineErrorReason, message: string, path?: string) {
		super('CombatEngineError', message, 'CEE(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatEngineErrorReason };
export default CombatEngineError;
