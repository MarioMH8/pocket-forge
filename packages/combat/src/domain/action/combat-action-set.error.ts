import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Action Set can fail validation.
 */
type CombatActionSetErrorReason =
	| 'duplicate-move-binding'
	| 'invalid-action-id'
	| 'invalid-config'
	| 'invalid-move-id'
	| 'invalid-plugin-id'
	| 'unknown-action';

/**
 * Structured validation failure for an authored Combat Action Set.
 *
 * Errors are aggregated by the action set validator instead of thrown, so
 * callers can report every problem at once.
 */
class CombatActionSetError extends DomainError {
	/**
	 * Optional dot-separated path to the offending primitive or binding.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatActionSetErrorReason;

	constructor(reason: CombatActionSetErrorReason, message: string, path?: string) {
		super('CombatActionSetError', message, 'CAS(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatActionSetErrorReason };
export default CombatActionSetError;
