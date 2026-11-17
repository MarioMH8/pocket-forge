import type { IndexedContentEntry } from './content-entry';

/**
 * Validated content of every selected Pack, merged by contribution kind.
 *
 * Every binding factory receives this index.
 */
class ContentIndex {
	private constructor(private readonly entries: readonly IndexedContentEntry[]) {}

	/**
	 * Builds an index from entries already validated and deduplicated by the resolver.
	 *
	 * @param entries - Indexed content entries.
	 * @returns A content index over the entries.
	 */
	static fromEntries(entries: readonly IndexedContentEntry[]): ContentIndex {
		return new ContentIndex(Object.freeze([...entries]));
	}

	/**
	 * Finds one entry by kind and id.
	 *
	 * @param kind - Contribution kind to read.
	 * @param id - Entry id to find.
	 * @returns The matching entry, or `undefined`.
	 */
	find(kind: string, id: string): IndexedContentEntry | undefined {
		return this.entries.find(entry => entry.kind === kind && entry.id === id);
	}

	/**
	 * Returns every entry of a kind, in contribution order.
	 *
	 * @param kind - Contribution kind to read.
	 * @returns The entries of that kind, or an empty array.
	 */
	get(kind: string): readonly IndexedContentEntry[] {
		return this.entries.filter(entry => entry.kind === kind);
	}

	/**
	 * Lists every kind present in the index once, in insertion order.
	 *
	 * @returns The present contribution kinds.
	 */
	kinds(): readonly string[] {
		return [...new Set(this.entries.map(entry => entry.kind))];
	}

	/**
	 * Returns every indexed entry.
	 *
	 * @returns A copy of the indexed entries.
	 */
	toPrimitives(): readonly IndexedContentEntry[] {
		return [...this.entries];
	}
}

export default ContentIndex;
