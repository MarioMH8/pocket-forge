import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Transition can be rejected.
 */
type CombatTransitionErrorReason =
	'completed-combat' | 'duplicate-combatant' | 'duplicate-group' | 'invalid-membership';

/**
 * Structured rejection for a Combat Transition.
 *
 * Errors are aggregated by {@link Combat.apply} instead of thrown, so callers
 * can report every membership violation at once.
 */
class CombatTransitionError extends DomainError {
	/**
	 * Optional dot-separated path to the offending group or combatant.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatTransitionErrorReason;

	constructor(reason: CombatTransitionErrorReason, message: string, path?: string) {
		super('CombatTransitionError', message, 'CTE(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatTransitionErrorReason };
export default CombatTransitionError;
