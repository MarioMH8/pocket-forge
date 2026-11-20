import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import type { DuelmonMoveCategory, DuelmonType } from '../duelmon-types';
import { DuelmonTypes } from '../duelmon-types';

const FAIRY_TYPE = 'Fairy';
const UNKNOWN_MOVE_TYPE = '???';
const NORMAL_TYPE: DuelmonType = 'Normal';
const PHYSICAL_TYPES: ReadonlySet<DuelmonType> = new Set([
	'Bug',
	'Fighting',
	'Flying',
	'Ghost',
	'Ground',
	'Normal',
	'Poison',
	'Rock',
]);
const STATUS_CATEGORY: DuelmonMoveCategory = 'Status';

/**
 * Gen 1 normalisation policy for Showdown tables.
 *
 * The builder parses and merges Showdown entries; this class owns every
 * decision that turns modern data into Gen 1 vocabulary.
 */
class DuelmonGen1Normalizer {
	/**
	 * Derives the Gen 1 damage category.
	 *
	 * Status moves keep their declared category. Every other move is Physical
	 * when its type was physical in Gen 1 and Special otherwise.
	 *
	 * @param category - Category declared by Showdown.
	 * @param type - Normalised Gen 1 move type.
	 * @returns The Gen 1 move category.
	 */
	static category(category: string, type: DuelmonType): DuelmonMoveCategory {
		return category === STATUS_CATEGORY ? STATUS_CATEGORY : PHYSICAL_TYPES.has(type) ? 'Physical' : 'Special';
	}

	/**
	 * Replaces Showdown's unknown-type marker with `Normal`.
	 *
	 * The only Gen 1 move that uses `???` is Bide, which deals Normal-type
	 * damage.
	 *
	 * @param type - Type declared by the merged Showdown entry.
	 * @returns A Gen 1 move type.
	 */
	static moveType(type: string): DuelmonType {
		if (type === UNKNOWN_MOVE_TYPE) {
			return NORMAL_TYPE;
		}

		if (!DuelmonTypes.is(type)) {
			throw new InvalidArgumentError(`Unknown Duelmon move type "${type}"`);
		}

		return type;
	}

	/**
	 * Removes `Fairy`, which Gen 1 does not have.
	 *
	 * Once `Fairy` is dropped, a species without types falls back to `Normal`.
	 *
	 * @param types - Types declared by the Showdown entry.
	 * @returns The Gen 1 species types.
	 */
	static speciesTypes(types: readonly string[]): readonly DuelmonType[] {
		const gen1Types = types.filter(type => type !== FAIRY_TYPE);
		const normalized = gen1Types.length > 0 ? gen1Types : [NORMAL_TYPE];

		return normalized.map(type => {
			if (!DuelmonTypes.is(type)) {
				throw new InvalidArgumentError(`Unknown Duelmon species type "${type}"`);
			}

			return type;
		});
	}
}

export { DuelmonGen1Normalizer };

export default DuelmonGen1Normalizer;
