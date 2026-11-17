/**
 * Primitives of one content entry as stored in a contribution file.
 */
interface ContentEntryPrimitives {
	/**
	 * Kind-specific fields.
	 */
	readonly [key: string]: unknown;
	/**
	 * Identity of the entry within its contribution kind.
	 */
	readonly id: string;
}

/**
 * A content entry after the resolver has indexed it.
 */
interface IndexedContentEntry {
	/**
	 * Identity of the entry within its kind.
	 */
	readonly id: string;
	/**
	 * Contribution kind that owns the entry.
	 */
	readonly kind: string;
	/**
	 * Pack id, or `project` after a project override.
	 */
	readonly source: string;
	/**
	 * Kind-specific entry values, including its `id`.
	 */
	readonly value: Readonly<Record<string, unknown>>;
}

export type { ContentEntryPrimitives, IndexedContentEntry };
