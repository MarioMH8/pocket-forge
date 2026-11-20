import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Move Binding Set can be rejected.
 */
type CombatMoveBindingSetErrorReason =
	'duplicate-move-binding' | 'invalid-action-id' | 'invalid-config' | 'invalid-move-id' | 'unknown-action';

/**
 * Structured rejection produced while validating a Combat Move Binding Set.
 *
 * Validation failures are aggregated instead of thrown.
 */
class CombatMoveBindingSetError extends DomainError {
	/**
	 * Dot-separated path to the offending binding field.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatMoveBindingSetErrorReason;

	constructor(reason: CombatMoveBindingSetErrorReason, message: string, path?: string) {
		super('CombatMoveBindingSetError', message, 'CMB(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatMoveBindingSetErrorReason };
export default CombatMoveBindingSetError;
