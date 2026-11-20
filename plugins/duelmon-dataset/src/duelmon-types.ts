/**
 * The fifteen types available in the Gen 1 dataset.
 */
const DUELMON_TYPES = [
	'Normal',
	'Fire',
	'Water',
	'Electric',
	'Grass',
	'Ice',
	'Fighting',
	'Poison',
	'Ground',
	'Flying',
	'Psychic',
	'Bug',
	'Rock',
	'Ghost',
	'Dragon',
] as const;

/**
 * Move categories recognized by the Duelmon catalog.
 */
const DUELMON_MOVE_CATEGORIES = ['Physical', 'Special', 'Status'] as const;

/**
 * A Gen 1 elemental type.
 */
type DuelmonType = (typeof DUELMON_TYPES)[number];

/**
 * The category that decides which battle stats a move uses.
 */
type DuelmonMoveCategory = (typeof DUELMON_MOVE_CATEGORIES)[number];

/**
 * Shared Duelmon vocabulary used by the dataset, catalog, and action layers.
 *
 * The type list and move categories are defined once here so the dataset
 * shape, the builder normalisation policy, the attribute definitions, and the
 * catalog all speak the same language.
 */
class DuelmonTypes {
	/**
	 * Every Gen 1 type, in canonical order.
	 */
	static readonly ALL: readonly DuelmonType[] = DUELMON_TYPES;
	/**
	 * Every move category.
	 */
	static readonly MOVE_CATEGORIES: readonly DuelmonMoveCategory[] = DUELMON_MOVE_CATEGORIES;

	/**
	 * Narrows an unknown value to a Gen 1 type.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is one of the fifteen Gen 1 types.
	 */
	static is(value: unknown): value is DuelmonType {
		return typeof value === 'string' && (DUELMON_TYPES as readonly string[]).includes(value);
	}

	/**
	 * Narrows an unknown value to a move category.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is a supported move category.
	 */
	static isCategory(value: unknown): value is DuelmonMoveCategory {
		return typeof value === 'string' && (DUELMON_MOVE_CATEGORIES as readonly string[]).includes(value);
	}
}

export type { DuelmonMoveCategory, DuelmonType };
export { DuelmonTypes };
