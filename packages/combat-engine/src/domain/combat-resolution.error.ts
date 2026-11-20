import DomainError from '@hexadrop/error';

/**
 * Reasons a Combat Action Plugin can reject a resolution.
 */
type CombatResolutionErrorReason =
	'incompatible-contract' | 'invalid-action' | 'invalid-input' | 'invalid-target' | 'rejected';

/**
 * Structured rejection returned by a Combat Action Plugin.
 *
 * Plugins return these values instead of throwing so a rejected resolution
 * yields no successor transition, consumes no randomness, and leaves the prior
 * snapshot unchanged.
 */
class CombatResolutionError extends DomainError {
	/**
	 * Optional dot-separated path to the rejected input or target.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: CombatResolutionErrorReason;

	constructor(reason: CombatResolutionErrorReason, message: string, path?: string) {
		super('CombatResolutionError', message, 'CRE(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { CombatResolutionErrorReason };
export default CombatResolutionError;
