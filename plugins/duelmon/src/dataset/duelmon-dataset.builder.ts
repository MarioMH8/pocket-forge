import { DuelmonTypes } from '../duelmon.types';
import type {
	DuelmonAbility,
	DuelmonDataset,
	DuelmonMove,
	DuelmonMoveSecondary,
	DuelmonSpecies,
} from './duelmon-dataset.types';
import { DuelmonGen1Normalizer } from './duelmon-gen1-normalizer';

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

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): UnknownRecord {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object`);
	}

	return value;
}

function readNumber(entry: UnknownRecord, key: string, path: string): number {
	const value = entry[key];

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${path}.${key} must be a finite number`);
	}

	return value;
}

function readString(entry: UnknownRecord, key: string, path: string): string {
	const value = entry[key];

	if (typeof value !== 'string') {
		throw new TypeError(`${path}.${key} must be a string`);
	}

	return value;
}

function readStringArray(entry: UnknownRecord, key: string, path: string): readonly string[] {
	const value = entry[key];

	if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
		throw new TypeError(`${path}.${key} must be an array of strings`);
	}

	return value as readonly string[];
}

function optionalNumber(entry: UnknownRecord, key: string): number | undefined {
	const value = entry[key];

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalString(entry: UnknownRecord, key: string): string | undefined {
	const value = entry[key];

	return typeof value === 'string' ? value : undefined;
}

function readNumericRecord(value: unknown, path: string): Readonly<Record<string, number>> {
	if (!isRecord(value)) {
		return {};
	}

	const result: Record<string, number> = {};

	for (const [key, item] of Object.entries(value)) {
		if (typeof item !== 'number' || !Number.isFinite(item)) {
			throw new TypeError(`${path}.${key} must be a finite number`);
		}

		result[key] = item;
	}

	return result;
}

function optionalMultihit(entry: UnknownRecord): number | readonly number[] | undefined {
	const value = entry['multihit'];

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (Array.isArray(value) && value.every(item => typeof item === 'number')) {
		return value;
	}

	return undefined;
}

function optionalFraction(entry: UnknownRecord, key: string, path: string): readonly [number, number] | undefined {
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

	throw new TypeError(`${path}.${key} must be a [numerator, denominator] pair`);
}

function readSecondary(value: unknown, path: string): DuelmonMoveSecondary | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const chance = optionalNumber(value, 'chance');
	const status = optionalString(value, 'status');
	const volatileStatus = optionalString(value, 'volatileStatus');
	const boosts = isRecord(value['boosts']) ? readNumericRecord(value['boosts'], `${path}.boosts`) : undefined;
	const selfBoosts =
		isRecord(value['self']) && isRecord(value['self']['boosts'])
			? readNumericRecord(value['self']['boosts'], `${path}.self.boosts`)
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
 * Merges a Gen 1 override onto its base entry.
 *
 * An override that inherits keeps the base data and drops the marker. Any
 * other override replaces the entry entirely, matching Showdown's mod rules.
 */
function mergeEntry(base: unknown, overrideEntry: unknown): UnknownRecord {
	const baseEntry = isRecord(base) ? base : {};

	if (!isRecord(overrideEntry)) {
		return baseEntry;
	}

	if (overrideEntry['inherit'] === true) {
		const merged = { ...baseEntry, ...overrideEntry };
		delete merged['inherit'];

		return merged;
	}

	return overrideEntry;
}

function readBaseStats(entry: UnknownRecord, path: string): DuelmonSpecies['baseStats'] {
	const stats = requireRecord(entry['baseStats'], `${path}.baseStats`);

	return {
		atk: readNumber(stats, 'atk', `${path}.baseStats`),
		def: readNumber(stats, 'def', `${path}.baseStats`),
		hp: readNumber(stats, 'hp', `${path}.baseStats`),
		spa: readNumber(stats, 'spa', `${path}.baseStats`),
		spd: readNumber(stats, 'spd', `${path}.baseStats`),
		spe: readNumber(stats, 'spe', `${path}.baseStats`),
	};
}

function buildSpecies(pokedex: ShowdownTable, gen1Pokedex: ShowdownTable): readonly DuelmonSpecies[] {
	const species: DuelmonSpecies[] = [];

	for (const [id, baseEntry] of Object.entries(pokedex)) {
		const base = requireRecord(baseEntry, `pokedex.${id}`);
		const speciesNumber = base['num'];

		if (
			typeof speciesNumber !== 'number' ||
			speciesNumber < 1 ||
			speciesNumber > GEN1_SPECIES_MAX ||
			base['forme'] !== undefined
		) {
			continue;
		}

		const entry = mergeEntry(base, gen1Pokedex[id]);
		const path = `species.${id}`;

		species.push({
			baseStats: readBaseStats(entry, path),
			id,
			name: readString(entry, 'name', path),
			num: speciesNumber,
			types: DuelmonGen1Normalizer.speciesTypes(readStringArray(entry, 'types', path)),
		});
	}

	return species.toSorted((first, second) => first.num - second.num);
}

function readAccuracy(entry: UnknownRecord): number | true {
	const accuracy = entry['accuracy'];

	if (accuracy === true) {
		return true;
	}

	return typeof accuracy === 'number' ? accuracy : true;
}

function buildMove(id: string, baseEntry: UnknownRecord, gen1Entry: unknown): DuelmonMove {
	const merged = mergeEntry(baseEntry, gen1Entry);
	const path = `moves.${id}`;
	const type = DuelmonGen1Normalizer.moveType(readString(merged, 'type', path));
	const category = readString(merged, 'category', path);
	const secondary = readSecondary(merged['secondary'], `${path}.secondary`);
	const status = optionalString(merged, 'status');
	const volatileStatus = optionalString(merged, 'volatileStatus');
	const drain = optionalFraction(merged, 'drain', path);
	const recoil = optionalFraction(merged, 'recoil', path);
	const multihit = optionalMultihit(merged);
	const critRatio = optionalNumber(merged, 'critRatio');
	const boosts = isRecord(merged['boosts']) ? readNumericRecord(merged['boosts'], `${path}.boosts`) : undefined;

	return {
		accuracy: readAccuracy(merged),
		category: DuelmonGen1Normalizer.category(category, type),
		...(critRatio !== undefined && { critRatio }),
		...(drain !== undefined && { drain }),
		flags: readNumericRecord(merged['flags'], `${path}.flags`),
		...(boosts !== undefined && { boosts }),
		...(multihit !== undefined && { multihit }),
		id,
		name: readString(merged, 'name', path),
		power: optionalNumber(merged, 'basePower') ?? 0,
		pp: readNumber(merged, 'pp', path),
		priority: readNumber(merged, 'priority', path),
		...(recoil !== undefined && { recoil }),
		...(secondary !== undefined && { secondary }),
		...(status !== undefined && { status }),
		target: readString(merged, 'target', path),
		type,
		...(volatileStatus !== undefined && { volatileStatus }),
	};
}

function buildMoves(moves: ShowdownTable, gen1Moves: ShowdownTable): readonly DuelmonMove[] {
	const result: { readonly move: DuelmonMove; readonly num: number }[] = [];

	for (const [id, baseEntry] of Object.entries(moves)) {
		const entry = requireRecord(baseEntry, `moves.${id}`);
		const moveNumber = entry['num'];

		if (typeof moveNumber !== 'number' || moveNumber < 1 || moveNumber > GEN1_MOVE_MAX) {
			continue;
		}

		result.push({ move: buildMove(id, entry, gen1Moves[id]), num: moveNumber });
	}

	return result.toSorted((first, second) => first.num - second.num).map(entry => entry.move);
}

function readDamageTaken(merged: UnknownRecord): Readonly<Record<string, number>> {
	const damage = isRecord(merged['damageTaken']) ? merged['damageTaken'] : {};
	const damageTaken = Object.fromEntries(DuelmonTypes.ALL.map(type => [type, 0]));

	for (const [attackType, value] of Object.entries(damage)) {
		if (typeof value === 'number' && Number.isFinite(value) && DuelmonTypes.is(attackType)) {
			damageTaken[attackType] = value;
		}
	}

	return damageTaken;
}

function buildTypechart(
	typechart: ShowdownTable,
	gen1Typechart: ShowdownTable
): Readonly<Record<string, Readonly<Record<string, number>>>> {
	const result: Record<string, Readonly<Record<string, number>>> = {};

	for (const type of DuelmonTypes.ALL) {
		const key = type.toLowerCase();
		const merged = mergeEntry(requireRecord(typechart[key], `typechart.${key}`), gen1Typechart[key]);

		result[type] = readDamageTaken(merged);
	}

	return result;
}

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
	 * @throws {Error} When the commit is empty or a table entry is malformed.
	 */
	static build({ commit, tables }: BuildDuelmonDatasetOptions): DuelmonDataset {
		if (commit.trim().length === 0) {
			throw new Error('A Showdown commit is required');
		}

		const abilities: readonly DuelmonAbility[] = [];

		return {
			abilities,
			generation: 1,
			moves: buildMoves(tables.moves, tables.gen1Moves),
			source: { commit, repository: 'smogon/pokemon-showdown' },
			species: buildSpecies(tables.pokedex, tables.gen1Pokedex),
			typechart: buildTypechart(tables.typechart, tables.gen1Typechart),
		};
	}
}

export type { BuildDuelmonDatasetOptions, ShowdownTables };
export { DuelmonDatasetBuilder };
