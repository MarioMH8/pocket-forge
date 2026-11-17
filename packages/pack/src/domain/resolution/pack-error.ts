import DomainError from '@hexadrop/error';

/**
 * Reasons Pack resolution can fail.
 */
type PackErrorReason =
	| 'content-read-failed'
	| 'duplicate-content-id'
	| 'duplicate-extension'
	| 'invalid-content'
	| 'invalid-override'
	| 'missing-contract'
	| 'unknown-kind'
	| 'unsupported-contract';

/**
 * Structured failure produced while resolving selected Packs.
 *
 * Errors are aggregated by {@link PackResolver.resolve} instead of thrown, so
 * callers can report every problem at once and produce no game definition.
 */
class PackError extends DomainError {
	/**
	 * Pack that caused the failure, when it belongs to one Pack.
	 */
	readonly packId: string | undefined;
	/**
	 * Optional dot-separated path to the offending contribution, entry, or field.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: PackErrorReason;

	constructor(reason: PackErrorReason, message: string, path?: string, packId?: string) {
		super('PackError', message, 'PKE(422)');
		this.packId = packId;
		this.path = path;
		this.reason = reason;
	}
}

export type { PackErrorReason };
export default PackError;
