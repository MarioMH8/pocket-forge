import InvalidArgumentError from '@hexadrop/error/invalid-argument';

import { DuelmonGen1Normalizer } from './duelmon-gen1-normalizer';
import type { DuelmonMoveCategory, DuelmonType } from './duelmon-types';
import { DuelmonTypes } from './duelmon-types';

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

type ShowdownTable = Record<string, unknown>;
type UnknownRecord = Record<string, unknown>;

/**
 * Showdown tables needed to build the Gen 1 dataset.
 */
interface ShowdownTables {
	readonly gen1Moves: ShowdownTable;
	readonly gen1Pokedex: ShowdownTable;
	readonly gen1Typechart: ShowdownTable;
	readonly moves: ShowdownTable;
	readonly pokedex: ShowdownTable;
	readonly typechart: ShowdownTable;
}

/**
 * Input for a deterministic dataset build.
 */
interface BuildDuelmonDatasetOptions {
	readonly commit: string;
	readonly tables: ShowdownTables;
}

const GEN1_SPECIES_MAX = 151;
const GEN1_MOVE_MAX = 165;

/**
 * Builds the curated Gen 1 dataset from Showdown tables.
 *
 * The builder is pure: it does not read files, fetch a repository, or mutate
 * its inputs.
 */
class DuelmonDatasetBuilder {
	/**
	 * Builds the serializable Duelmon Gen 1 dataset.
	 *
	 * @param options - Pinned commit and the base and Gen 1 Showdown tables.
	 * @returns The serializable Duelmon Gen 1 dataset.
	 * @throws {InvalidArgumentError} When the commit is empty or a table entry is malformed.
	 */
	static build({ commit, tables }: BuildDuelmonDatasetOptions): DuelmonDataset {
		if (commit.trim().length === 0) {
			throw new InvalidArgumentError('A Showdown commit is required');
		}

		const abilities: readonly DuelmonAbility[] = [];

		return {
			abilities,
			generation: 1,
			moves: this.buildMoves(tables.moves, tables.gen1Moves),
			source: { commit, repository: 'smogon/pokemon-showdown' },
			species: this.buildSpecies(tables.pokedex, tables.gen1Pokedex),
			typechart: this.buildTypechart(tables.typechart, tables.gen1Typechart),
		};
	}

	/**
	 * Builds one curated move from its base and Gen 1 entries.
	 *
	 * @param id - Showdown-normalized move id.
	 * @param baseEntry - Base Showdown move entry.
	 * @param gen1Entry - Gen 1 move override.
	 * @returns The curated move.
	 */
	private static buildMove(id: string, baseEntry: UnknownRecord, gen1Entry: unknown): DuelmonMove {
		const merged = this.mergeEntry(baseEntry, gen1Entry);
		const path = `moves.${id}`;
		const type = DuelmonGen1Normalizer.moveType(this.readString(merged, 'type', path));
		const category = this.readString(merged, 'category', path);
		const secondary = this.readSecondary(merged['secondary'], `${path}.secondary`);
		const status = this.optionalString(merged, 'status');
		const volatileStatus = this.optionalString(merged, 'volatileStatus');
		const drain = this.optionalFraction(merged, 'drain', path);
		const recoil = this.optionalFraction(merged, 'recoil', path);
		const multihit = this.optionalMultihit(merged);
		const critRatio = this.optionalNumber(merged, 'critRatio');
		const boosts = this.isRecord(merged['boosts'])
			? this.readNumericRecord(merged['boosts'], `${path}.boosts`)
			: undefined;

		return {
			accuracy: this.readAccuracy(merged),
			category: DuelmonGen1Normalizer.category(category, type),
			...(critRatio !== undefined && { critRatio }),
			...(drain !== undefined && { drain }),
			flags: this.readNumericRecord(merged['flags'], `${path}.flags`),
			...(boosts !== undefined && { boosts }),
			...(multihit !== undefined && { multihit }),
			id,
			name: this.readString(merged, 'name', path),
			power: this.optionalNumber(merged, 'basePower') ?? 0,
			pp: this.readNumber(merged, 'pp', path),
			priority: this.readNumber(merged, 'priority', path),
			...(recoil !== undefined && { recoil }),
			...(secondary !== undefined && { secondary }),
			...(status !== undefined && { status }),
			target: this.readString(merged, 'target', path),
			type,
			...(volatileStatus !== undefined && { volatileStatus }),
		};
	}

	/**
	 * Builds the curated Gen 1 moves list.
	 *
	 * @param moves - Base Showdown moves table.
	 * @param gen1Moves - Gen 1 move overrides.
	 * @returns The sorted move list.
	 */
	private static buildMoves(moves: ShowdownTable, gen1Moves: ShowdownTable): readonly DuelmonMove[] {
		const result: { readonly move: DuelmonMove; readonly num: number }[] = [];

		for (const [id, baseEntry] of Object.entries(moves)) {
			const entry = this.requireRecord(baseEntry, `moves.${id}`);
			const moveNumber = entry['num'];

			if (typeof moveNumber !== 'number' || moveNumber < 1 || moveNumber > GEN1_MOVE_MAX) {
				continue;
			}

			result.push({ move: this.buildMove(id, entry, gen1Moves[id]), num: moveNumber });
		}

		return result.toSorted((first, second) => first.num - second.num).map(entry => entry.move);
	}

	/**
	 * Builds the curated Gen 1 species list.
	 *
	 * @param pokedex - Base Showdown Pokédex table.
	 * @param gen1Pokedex - Gen 1 Pokédex overrides.
	 * @returns The sorted species list.
	 */
	private static buildSpecies(pokedex: ShowdownTable, gen1Pokedex: ShowdownTable): readonly DuelmonSpecies[] {
		const species: DuelmonSpecies[] = [];

		for (const [id, baseEntry] of Object.entries(pokedex)) {
			const base = this.requireRecord(baseEntry, `pokedex.${id}`);
			const speciesNumber = base['num'];

			if (
				typeof speciesNumber !== 'number' ||
				speciesNumber < 1 ||
				speciesNumber > GEN1_SPECIES_MAX ||
				base['forme'] !== undefined
			) {
				continue;
			}

			const entry = this.mergeEntry(base, gen1Pokedex[id]);
			const path = `species.${id}`;

			species.push({
				baseStats: this.readBaseStats(entry, path),
				id,
				name: this.readString(entry, 'name', path),
				num: speciesNumber,
				types: DuelmonGen1Normalizer.speciesTypes(this.readStringArray(entry, 'types', path)),
			});
		}

		return species.toSorted((first, second) => first.num - second.num);
	}

	/**
	 * Builds the Gen 1 defensive type chart.
	 *
	 * @param typechart - Base Showdown type chart.
	 * @param gen1Typechart - Gen 1 type chart overrides.
	 * @returns The chart keyed by capitalized defender type.
	 */
	private static buildTypechart(
		typechart: ShowdownTable,
		gen1Typechart: ShowdownTable
	): Readonly<Record<string, Readonly<Record<string, number>>>> {
		const result: Record<string, Readonly<Record<string, number>>> = {};

		for (const type of DuelmonTypes.ALL) {
			const key = type.toLowerCase();
			const merged = this.mergeEntry(this.requireRecord(typechart[key], `typechart.${key}`), gen1Typechart[key]);

			result[type] = this.readDamageTaken(merged);
		}

		return result;
	}

	/**
	 * Narrows an unknown value to a plain object.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is a non-array object.
	 */
	private static isRecord(value: unknown): value is UnknownRecord {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	/**
	 * Merges a Gen 1 override onto its base entry.
	 *
	 * An override that inherits keeps the base data and drops the marker. Any
	 * other override replaces the entry entirely, matching Showdown's mod rules.
	 *
	 * @param base - Base Showdown entry.
	 * @param overrideEntry - Gen 1 override entry.
	 * @returns The merged entry.
	 */
	private static mergeEntry(base: unknown, overrideEntry: unknown): UnknownRecord {
		const baseEntry = this.isRecord(base) ? base : {};

		if (!this.isRecord(overrideEntry)) {
			return baseEntry;
		}

		if (overrideEntry['inherit'] === true) {
			const merged = { ...baseEntry, ...overrideEntry };
			delete merged['inherit'];

			return merged;
		}

		return overrideEntry;
	}

	/**
	 * Reads an optional `[numerator, denominator]` fraction.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @param path - Showdown table path used in errors.
	 * @returns The fraction, or `undefined`.
	 * @throws {InvalidArgumentError} When the value is not a valid fraction.
	 */
	private static optionalFraction(
		entry: UnknownRecord,
		key: string,
		path: string
	): readonly [number, number] | undefined {
		const value = entry[key];

		if (value === undefined) {
			return undefined;
		}

		if (typeof value === 'number' && Number.isFinite(value)) {
			return [value, 1];
		}

		if (Array.isArray(value) && value.length === 2) {
			const numerator: unknown = value[0];
			const denominator: unknown = value[1];

			if (
				typeof numerator === 'number' &&
				typeof denominator === 'number' &&
				Number.isFinite(numerator) &&
				Number.isFinite(denominator)
			) {
				return [numerator, denominator];
			}
		}

		throw new InvalidArgumentError(`${path}.${key} must be a [numerator, denominator] pair`);
	}

	/**
	 * Reads the optional multihit value of a move.
	 *
	 * @param entry - Showdown move entry.
	 * @returns The hit count or range, or `undefined`.
	 */
	private static optionalMultihit(entry: UnknownRecord): number | readonly number[] | undefined {
		const value = entry['multihit'];

		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}

		if (Array.isArray(value) && value.every(item => typeof item === 'number')) {
			return value;
		}

		return undefined;
	}

	/**
	 * Reads a finite number when present.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @returns The finite number, or `undefined`.
	 */
	private static optionalNumber(entry: UnknownRecord, key: string): number | undefined {
		const value = entry[key];

		return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
	}

	/**
	 * Reads a string when present.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @returns The string, or `undefined`.
	 */
	private static optionalString(entry: UnknownRecord, key: string): string | undefined {
		const value = entry[key];

		return typeof value === 'string' ? value : undefined;
	}

	/**
	 * Reads a move's accuracy.
	 *
	 * @param entry - Merged move entry.
	 * @returns The accuracy percentage, or `true` when the move never misses.
	 */
	private static readAccuracy(entry: UnknownRecord): number | true {
		const accuracy = entry['accuracy'];

		if (accuracy === true) {
			return true;
		}

		return typeof accuracy === 'number' ? accuracy : true;
	}

	/**
	 * Reads the base stats of a species entry.
	 *
	 * @param entry - Merged species entry.
	 * @param path - Showdown table path used in errors.
	 * @returns The base stats.
	 */
	private static readBaseStats(entry: UnknownRecord, path: string): DuelmonSpecies['baseStats'] {
		const stats = this.requireRecord(entry['baseStats'], `${path}.baseStats`);

		return {
			atk: this.readNumber(stats, 'atk', `${path}.baseStats`),
			def: this.readNumber(stats, 'def', `${path}.baseStats`),
			hp: this.readNumber(stats, 'hp', `${path}.baseStats`),
			spa: this.readNumber(stats, 'spa', `${path}.baseStats`),
			spd: this.readNumber(stats, 'spd', `${path}.baseStats`),
			spe: this.readNumber(stats, 'spe', `${path}.baseStats`),
		};
	}

	/**
	 * Reads a defender's complete damage-taken record.
	 *
	 * @param merged - Merged typechart entry.
	 * @returns Damage-taken codes keyed by attack type.
	 */
	private static readDamageTaken(merged: UnknownRecord): Readonly<Record<string, number>> {
		const damage = this.isRecord(merged['damageTaken']) ? merged['damageTaken'] : {};
		const damageTaken = Object.fromEntries(DuelmonTypes.ALL.map(type => [type, 0]));

		for (const [attackType, value] of Object.entries(damage)) {
			if (typeof value === 'number' && Number.isFinite(value) && DuelmonTypes.is(attackType)) {
				damageTaken[attackType] = value;
			}
		}

		return damageTaken;
	}

	/**
	 * Reads a finite number from an entry.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @param path - Showdown table path used in errors.
	 * @returns The finite number.
	 * @throws {InvalidArgumentError} When the value is not a finite number.
	 */
	private static readNumber(entry: UnknownRecord, key: string, path: string): number {
		const value = entry[key];

		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new InvalidArgumentError(`${path}.${key} must be a finite number`);
		}

		return value;
	}

	/**
	 * Reads a record whose values must all be finite numbers.
	 *
	 * @param value - Candidate record.
	 * @param path - Showdown table path used in errors.
	 * @returns The numeric record, or an empty record when the value is not an object.
	 * @throws {InvalidArgumentError} When a value is not a finite number.
	 */
	private static readNumericRecord(value: unknown, path: string): Readonly<Record<string, number>> {
		if (!this.isRecord(value)) {
			return {};
		}

		const result: Record<string, number> = {};

		for (const [key, item] of Object.entries(value)) {
			if (typeof item !== 'number' || !Number.isFinite(item)) {
				throw new InvalidArgumentError(`${path}.${key} must be a finite number`);
			}

			result[key] = item;
		}

		return result;
	}

	/**
	 * Reads the curated secondary effect of a move.
	 *
	 * @param value - Candidate secondary effect.
	 * @param path - Showdown table path used in errors.
	 * @returns The curated secondary effect, or `undefined`.
	 */
	private static readSecondary(value: unknown, path: string): DuelmonMoveSecondary | undefined {
		if (!this.isRecord(value)) {
			return undefined;
		}

		const chance = this.optionalNumber(value, 'chance');
		const status = this.optionalString(value, 'status');
		const volatileStatus = this.optionalString(value, 'volatileStatus');
		const boosts = this.isRecord(value['boosts'])
			? this.readNumericRecord(value['boosts'], `${path}.boosts`)
			: undefined;
		const selfBoosts =
			this.isRecord(value['self']) && this.isRecord(value['self']['boosts'])
				? this.readNumericRecord(value['self']['boosts'], `${path}.self.boosts`)
				: undefined;

		const secondary: DuelmonMoveSecondary = {
			...(chance !== undefined && { chance }),
			...(boosts !== undefined && { boosts }),
			...(status !== undefined && { status }),
			...(volatileStatus !== undefined && { volatileStatus }),
			...(selfBoosts !== undefined && { self: { boosts: selfBoosts } }),
		};

		return Object.keys(secondary).length > 0 ? secondary : undefined;
	}

	/**
	 * Reads a string from an entry.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @param path - Showdown table path used in errors.
	 * @returns The string value.
	 * @throws {InvalidArgumentError} When the value is not a string.
	 */
	private static readString(entry: UnknownRecord, key: string, path: string): string {
		const value = entry[key];

		if (typeof value !== 'string') {
			throw new InvalidArgumentError(`${path}.${key} must be a string`);
		}

		return value;
	}

	/**
	 * Reads an array of strings from an entry.
	 *
	 * @param entry - Showdown entry.
	 * @param key - Entry key.
	 * @param path - Showdown table path used in errors.
	 * @returns The string array.
	 * @throws {InvalidArgumentError} When the value is not an array of strings.
	 */
	private static readStringArray(entry: UnknownRecord, key: string, path: string): readonly string[] {
		const value = entry[key];

		if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
			throw new InvalidArgumentError(`${path}.${key} must be an array of strings`);
		}

		return value as readonly string[];
	}

	/**
	 * Requires a plain object at the given path.
	 *
	 * @param value - Candidate value.
	 * @param path - Showdown table path used in errors.
	 * @returns The value as a plain object.
	 * @throws {InvalidArgumentError} When the value is not an object.
	 */
	private static requireRecord(value: unknown, path: string): UnknownRecord {
		if (!this.isRecord(value)) {
			throw new InvalidArgumentError(`${path} must be an object`);
		}

		return value;
	}
}

export type {
	BuildDuelmonDatasetOptions,
	DuelmonAbility,
	DuelmonDataset,
	DuelmonMove,
	DuelmonMoveSecondary,
	DuelmonSpecies,
	ShowdownTables,
};
export { DuelmonDatasetBuilder };
