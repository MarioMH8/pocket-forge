import DomainError from '@hexadrop/error';

/**
 * Reasons a Pack Manifest can fail validation.
 */
type PackManifestErrorReason =
	'invalid-contract' | 'invalid-contribution' | 'invalid-extension' | 'invalid-id' | 'invalid-version';

/**
 * Structured validation failure for a Pack Manifest.
 *
 * Errors are aggregated by {@link PackManifest.create} instead of thrown, so
 * callers can report every problem at once.
 */
class PackManifestError extends DomainError {
	/**
	 * Optional dot-separated path to the offending manifest field.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: PackManifestErrorReason;

	constructor(reason: PackManifestErrorReason, message: string, path?: string) {
		super('PackManifestError', message, 'PME(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { PackManifestErrorReason };
export default PackManifestError;
