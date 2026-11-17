import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Setup can fail validation.
 */
type CombatSetupErrorReason = 'incompatible-action-set';

/**
 * Structured rejection produced when the static composition of a Combat Setup
 * is invalid.
 *
 * A setup is a snapshot of a valid composition, so these errors are returned
 * when the setup is created, never while resolving an action.
 */
class CombatSetupError extends DomainError {
	/**
	 * Optional dot-separated path to the offending composition element.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatSetupErrorReason;

	constructor(reason: CombatSetupErrorReason, message: string, path?: string) {
		super('CombatSetupError', message, 'CSE(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatSetupErrorReason };
export default CombatSetupError;
