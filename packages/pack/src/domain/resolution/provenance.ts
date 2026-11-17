/**
 * Record of which Packs contributed one content entry.
 */
interface ContentProvenance {
	/**
	 * Identity of the entry within its kind.
	 */
	readonly id: string;
	/**
	 * Contribution kind that owns the entry.
	 */
	readonly kind: string;
	/**
	 * Pack ids that contributed the entry, in selection order. `['project']` after an override.
	 */
	readonly sources: readonly string[];
}

/**
 * Record of which binding won one capability and which bindings it shadowed.
 */
interface BindingProvenance {
	/**
	 * Capability name.
	 */
	readonly capability: string;
	/**
	 * Sources whose bindings were shadowed, in replacement order.
	 */
	readonly shadowed: readonly string[];
	/**
	 * Source that owns the winning binding.
	 */
	readonly winner: string;
}

/**
 * Record of which Pack contributed each piece and which bindings were shadowed.
 */
interface Provenance {
	/**
	 * Provenance of every capability that had more than one binding.
	 */
	readonly bindings: readonly BindingProvenance[];
	/**
	 * Provenance of every surviving content entry.
	 */
	readonly content: readonly ContentProvenance[];
}

export type { BindingProvenance, ContentProvenance, Provenance };
