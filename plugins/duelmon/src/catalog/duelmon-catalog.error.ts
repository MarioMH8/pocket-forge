import DomainError from '@hexadrop/error';

/**
 * Reasons the Duelmon catalog can reject a dataset.
 */
type DuelmonCatalogErrorReason =
	'duplicate-id' | 'invalid-move' | 'invalid-species' | 'invalid-type-chart' | 'unknown-type';

/**
 * Structured validation failure returned by `DuelmonCatalog.fromDataset`.
 *
 * The catalog validates the complete dataset before constructing any entity,
 * so callers receive every problem at once and `typeMultipliers` never throws
 * lazily during action resolution.
 */
class DuelmonCatalogError extends DomainError {
	/**
	 * Optional dot-separated path to the offending dataset entry.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: DuelmonCatalogErrorReason;

	constructor(reason: DuelmonCatalogErrorReason, message: string, path?: string) {
		super('DuelmonCatalogError', message, 'DMC(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { DuelmonCatalogErrorReason };
export { DuelmonCatalogError };

export default DuelmonCatalogError;
