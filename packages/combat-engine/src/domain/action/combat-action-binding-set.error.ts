import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Action Binding Set can be rejected.
 */
type CombatActionBindingSetErrorReason =
	'duplicate-action-binding' | 'invalid-action-id' | 'invalid-config' | 'invalid-move-id' | 'unknown-action';

/**
 * Structured rejection produced while validating a Combat Action Binding Set.
 *
 * Validation failures are aggregated instead of thrown.
 */
class CombatActionBindingSetError extends DomainError {
	/**
	 * Dot-separated path to the offending binding field.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatActionBindingSetErrorReason;

	constructor(reason: CombatActionBindingSetErrorReason, message: string, path?: string) {
		super('CombatActionBindingSetError', message, 'CAB(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatActionBindingSetErrorReason };
export default CombatActionBindingSetError;
