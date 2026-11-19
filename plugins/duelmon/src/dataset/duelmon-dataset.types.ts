/**
 * Curated, serializable species entry extracted from Pokémon Showdown.
 */
interface DuelmonSpecies {
	readonly baseStats: {
		readonly atk: number;
		readonly def: number;
		readonly hp: number;
		readonly spa: number;
		readonly spd: number;
		readonly spe: number;
	};
	readonly id: string;
	readonly name: string;
	readonly num: number;
	readonly types: readonly string[];
}

/**
 * Curated, serializable move entry extracted from Pokémon Showdown.
 */
interface DuelmonMove {
	readonly accuracy: number | true;
	readonly boosts?: Readonly<Record<string, number>>;
	readonly category: 'Physical' | 'Special' | 'Status';
	readonly critRatio?: number;
	readonly drain?: number;
	readonly flags: Readonly<Record<string, number>>;
	readonly id: string;
	readonly multihit?: number | readonly number[];
	readonly name: string;
	readonly power: number;
	readonly pp: number;
	readonly priority: number;
	readonly recoil?: number;
	readonly secondary?: unknown;
	readonly status?: string;
	readonly target: string;
	readonly type: string;
	readonly volatileStatus?: string;
}

/**
 * Complete Gen 1 dataset consumed by the private Duelmon package.
 */
interface DuelmonDataset {
	readonly abilities: readonly never[];
	readonly generation: 1;
	readonly moves: readonly DuelmonMove[];
	readonly source: { readonly commit: string; readonly repository: 'smogon/pokemon-showdown' };
	readonly species: readonly DuelmonSpecies[];
	readonly typechart: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

export type { DuelmonDataset, DuelmonMove, DuelmonSpecies };
