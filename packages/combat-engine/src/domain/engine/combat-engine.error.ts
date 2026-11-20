import DomainError from '@hexadrop/error';

/**
 * Reasons the Combat Engine can reject a resolution.
 */
type CombatEngineErrorReason = 'combat-not-active' | 'conflicting-outcome' | 'invalid-outcome' | 'invalid-transition';

/**
 * Structured rejection produced by the Combat Engine.
 *
 * The engine returns these values instead of throwing, so a rejected
 * resolution leaves the input Combat untouched and produces no events.
 */
class CombatEngineError extends DomainError {
	/**
	 * Dot-separated path to the offending value.
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
