import Either from '@hexadrop/either';
import type { CombatResolutionErrorReason } from '@pocket-forge/combat/domain';
import { CombatResolutionError } from '@pocket-forge/combat/domain';

/**
 * Result helpers for Duelmon action resolutions.
 */
class DuelmonErrors {
	/**
	 * Builds a single-failure result.
	 *
	 * @param reason - Structured failure reason.
	 * @param message - Human-readable failure message.
	 * @param path - Input or configuration path that failed.
	 * @returns A left result carrying one resolution error.
	 */
	static fail<T = never>(
		reason: CombatResolutionErrorReason,
		message: string,
		path: string
	): Either<CombatResolutionError[], T> {
		return Either.left([new CombatResolutionError(reason, message, path)]);
	}
}

export { DuelmonErrors };

export default DuelmonErrors;
