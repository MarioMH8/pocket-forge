/**
 * Project-level removal of one contributed content entry.
 */
interface RemoveContentOverride {
	/**
	 * Identity of the entry within its kind.
	 */
	readonly id: string;
	/**
	 * Contribution kind that owns the entry.
	 */
	readonly kind: string;
	/**
	 * Removes the entry.
	 */
	readonly operation: 'remove';
}

/**
 * Project-level replacement of one contributed content entry.
 */
interface ReplaceContentOverride {
	/**
	 * Identity of the entry within its kind.
	 */
	readonly id: string;
	/**
	 * Contribution kind that owns the entry.
	 */
	readonly kind: string;
	/**
	 * Replaces the whole entry.
	 */
	readonly operation: 'replace';
	/**
	 * Complete replacement entry, including its `id`.
	 */
	readonly value: Readonly<Record<string, unknown>>;
}

/**
 * Project-level operation on one contributed content entry.
 */
type ContentOverride = RemoveContentOverride | ReplaceContentOverride;

// An `export default` cannot reference a type under `verbatimModuleSyntax`.
// eslint-disable-next-line import/prefer-default-export
export type { ContentOverride };
