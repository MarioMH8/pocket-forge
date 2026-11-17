/**
 * Reasons resolution can succeed while reporting a diagnostic.
 */
type PackWarningReason = 'shadowed-binding';

/**
 * Non-blocking diagnostic produced by resolution.
 */
interface PackWarning {
	/**
	 * Human-readable explanation.
	 */
	readonly message: string;
	/**
	 * Optional path to the affected declaration.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable warning reason.
	 */
	readonly reason: PackWarningReason;
}

export type { PackWarning, PackWarningReason };
