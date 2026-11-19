import type { DuelmonMoveCategory, DuelmonType } from '../duelmon.types';

/**
 * Curated, serializable species entry extracted from Pokémon Showdown.
 */
interface DuelmonSpecies {
	/**
	 * Base stats. Gen 1 uses the same value for `spa` and `spd` (the Special stat).
	 */
	readonly baseStats: {
		/**
		 *Base Attack.
		 */
		readonly atk: number;
		/**
		 *Base Defense.
		 */
		readonly def: number;
		/**
		 *Base HP.
		 */
		readonly hp: number;
		/**
		 *Base Special Attack (Gen 1 Special).
		 */
		readonly spa: number;
		/**
		 *Base Special Defense (Gen 1 Special).
		 */
		readonly spd: number;
		/**
		 *Base Speed.
		 */
		readonly spe: number;
	};
	/**
	 *Showdown-normalized species id.
	 */
	readonly id: string;
	/**
	 *Display name.
	 */
	readonly name: string;
	/**
	 *National dex number, restricted to 1–151.
	 */
	readonly num: number;
	/**
	 *Gen 1 types.
	 */
	readonly types: readonly DuelmonType[];
}

/**
 * Curated serializable secondary effect of a move.
 */
interface DuelmonMoveSecondary {
	/**
	 *Stat stage changes applied to the target.
	 */
	readonly boosts?: Readonly<Record<string, number>>;
	/**
	 *Percentage chance, 0–100.
	 */
	readonly chance?: number;
	/**
	 *Stat stage changes applied to the user.
	 */
	readonly self?: {
		/**
		 *User stat stage changes.
		 */
		readonly boosts?: Readonly<Record<string, number>>;
	};
	/**
	 *Status inflicted on the target.
	 */
	readonly status?: string;
	/**
	 *Volatile status inflicted on the target.
	 */
	readonly volatileStatus?: string;
}

/**
 * Curated, serializable move entry extracted from Pokémon Showdown.
 */
interface DuelmonMove {
	/**
	 *Accuracy percentage, or `true` when the move never misses.
	 */
	readonly accuracy: number | true;
	/**
	 *Stat stage changes applied to the user.
	 */
	readonly boosts?: Readonly<Record<string, number>>;
	/**
	 *Gen 1 damage category, derived from the type.
	 */
	readonly category: DuelmonMoveCategory;
	/**
	 *High-critical-hit ratio when greater than 1.
	 */
	readonly critRatio?: number;
	/**
	 *Fraction of damage drained, as `[numerator, denominator]`.
	 */
	readonly drain?: readonly [number, number];
	/**
	 *Showdown move flags.
	 */
	readonly flags: Readonly<Record<string, number>>;
	/**
	 *Showdown-normalized move id.
	 */
	readonly id: string;
	/**
	 *Number of hits, or a `[min, max]` range.
	 */
	readonly multihit?: number | readonly number[];
	/**
	 *Display name.
	 */
	readonly name: string;
	/**
	 *Base power.
	 */
	readonly power: number;
	/**
	 *Base PP.
	 */
	readonly pp: number;
	/**
	 *Priority bracket.
	 */
	readonly priority: number;
	/**
	 *Fraction of damage recoiled, as `[numerator, denominator]`.
	 */
	readonly recoil?: readonly [number, number];
	/**
	 *Curated secondary effect.
	 */
	readonly secondary?: DuelmonMoveSecondary;
	/**
	 *Primary status inflicted on the target.
	 */
	readonly status?: string;
	/**
	 *Showdown target selector.
	 */
	readonly target: string;
	/**
	 *Move type.
	 */
	readonly type: DuelmonType;
	/**
	 *Primary volatile status inflicted on the target.
	 */
	readonly volatileStatus?: string;
}

/**
 * Curated, serializable ability entry.
 *
 * Gen 1 has no abilities, so the Gen 1 dataset always ships an empty list.
 */
interface DuelmonAbility {
	/**
	 *Short description when one is available.
	 */
	readonly description?: string;
	/**
	 *Showdown-normalized ability id.
	 */
	readonly id: string;
	/**
	 *Display name.
	 */
	readonly name: string;
}

/**
 * Complete Gen 1 dataset consumed by the private Duelmon package.
 */
interface DuelmonDataset {
	/**
	 *Abilities in the dataset. Empty for Gen 1.
	 */
	readonly abilities: readonly DuelmonAbility[];
	/**
	 *Dataset generation.
	 */
	readonly generation: 1;
	/**
	 *Curated moves.
	 */
	readonly moves: readonly DuelmonMove[];
	/**
	 *Pinned source metadata.
	 */
	readonly source: {
		/**
		 *Exact Showdown commit the dataset was requested from.
		 */
		readonly commit: string;
		/**
		 *Upstream repository.
		 */
		readonly repository: 'smogon/pokemon-showdown';
	};
	/**
	 *Curated species.
	 */
	readonly species: readonly DuelmonSpecies[];
	/**
	 *Gen 1 defensive type chart, keyed by capitalized type name.
	 */
	readonly typechart: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

export type { DuelmonAbility, DuelmonDataset, DuelmonMove, DuelmonMoveSecondary, DuelmonSpecies };
