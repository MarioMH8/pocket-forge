import type { DuelmonDataset, DuelmonMove, DuelmonSpecies } from './duelmon-dataset.types';

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
const GEN1_TYPES = [
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
const GEN1_TYPE_SET = new Set<string>(GEN1_TYPES);
const EXCLUDED_TYPES = new Set(['dark', 'fairy', 'steel', 'stellar']);
const PHYSICAL_TYPES = new Set(['Bug', 'Fighting', 'Flying', 'Ghost', 'Ground', 'Normal', 'Poison', 'Rock']);

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): UnknownRecord {
	if (!isRecord(value)) {
		throw new Error(`${path} must be an object`);
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

function readNumericRecord(value: unknown): Readonly<Record<string, number>> {
	if (!isRecord(value)) {
		return {};
	}

	const entries = Object.entries(value).filter(([, item]) => typeof item === 'number' && Number.isFinite(item));

	return Object.fromEntries(entries) as Record<string, number>;
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

/**
 * Merges a Gen 1 override onto its base entry.
 *
 * An override that inherits keeps the base data and drops the marker. Any
 * other override replaces the entry entirely, matching Showdown's mod rules.
 */
function mergeEntry(base: unknown, module_: unknown): UnknownRecord {
	const baseEntry = isRecord(base) ? base : {};
	const moduleEntry = isRecord(module_) ? module_ : {};

	if (!isRecord(module_)) {
		return baseEntry;
	}

	if (moduleEntry['inherit'] === true) {
		const merged = { ...baseEntry, ...moduleEntry };
		delete merged['inherit'];

		return merged;
	}

	return moduleEntry;
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

	for (const [id, gen1Entry] of Object.entries(gen1Pokedex)) {
		const entry = mergeEntry(pokedex[id], gen1Entry);
		const speciesNumber = entry['num'];

		if (typeof speciesNumber !== 'number' || speciesNumber < 1 || speciesNumber > GEN1_SPECIES_MAX) {
			continue;
		}

		const path = `species.${id}`;

		species.push({
			baseStats: readBaseStats(entry, path),
			id,
			name: readString(entry, 'name', path),
			num: speciesNumber,
			types: readStringArray(entry, 'types', path),
		});
	}

	return species.toSorted((first, second) => first.num - second.num);
}

function deriveCategory(baseCategory: string, type: string): DuelmonMove['category'] {
	if (baseCategory === 'Status') {
		return 'Status';
	}

	return PHYSICAL_TYPES.has(type) ? 'Physical' : 'Special';
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
	const type = readString(merged, 'type', path);
	const secondary = merged['secondary'];
	const status = optionalString(merged, 'status');
	const volatileStatus = optionalString(merged, 'volatileStatus');
	const drain = optionalNumber(merged, 'drain');
	const recoil = optionalNumber(merged, 'recoil');
	const multihit = optionalMultihit(merged);
	const critRatio = optionalNumber(merged, 'critRatio');
	const boosts = isRecord(merged['boosts']) ? readNumericRecord(merged['boosts']) : undefined;

	return {
		accuracy: readAccuracy(merged),
		category: deriveCategory(readString(baseEntry, 'category', path), type),
		...(critRatio !== undefined && { critRatio }),
		...(drain !== undefined && { drain }),
		flags: readNumericRecord(merged['flags']),
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

function buildDamageTaken(baseEntry: UnknownRecord, gen1Entry: unknown): Readonly<Record<string, number>> {
	const baseDamage = isRecord(baseEntry['damageTaken']) ? baseEntry['damageTaken'] : {};
	const gen1Record = isRecord(gen1Entry) ? gen1Entry : {};
	const gen1Damage = isRecord(gen1Record['damageTaken']) ? gen1Record['damageTaken'] : {};
	const damage: Record<string, unknown> = { ...baseDamage, ...gen1Damage };
	const damageTaken: Record<string, number> = {};

	for (const [attackType, value] of Object.entries(damage)) {
		if (typeof value !== 'number' || !Number.isFinite(value) || !GEN1_TYPE_SET.has(attackType)) {
			continue;
		}

		damageTaken[attackType] = value;
	}

	return damageTaken;
}

function buildTypechart(
	typechart: ShowdownTable,
	gen1Typechart: ShowdownTable
): Readonly<Record<string, Readonly<Record<string, number>>>> {
	const result: Record<string, Readonly<Record<string, number>>> = {};

	for (const [type, baseEntry] of Object.entries(typechart)) {
		const key = type.toLowerCase();

		if (EXCLUDED_TYPES.has(key)) {
			continue;
		}

		result[key] = buildDamageTaken(requireRecord(baseEntry, `typechart.${type}`), gen1Typechart[type]);
	}

	return result;
}

/**
 * Builds the curated Gen 1 dataset from Showdown tables.
 *
 * The builder is pure: it does not read files, fetch a repository, or mutate
 * its inputs.
 *
 * @param options - Pinned commit and the base and Gen 1 Showdown tables.
 * @returns The serializable Duelmon Gen 1 dataset.
 */
function buildDuelmonDataset({ commit, tables }: BuildDuelmonDatasetOptions): DuelmonDataset {
	if (commit.trim().length === 0) {
		throw new Error('A Showdown commit is required');
	}

	return {
		abilities: [],
		generation: 1,
		moves: buildMoves(tables.moves, tables.gen1Moves),
		source: { commit, repository: 'smogon/pokemon-showdown' },
		species: buildSpecies(tables.pokedex, tables.gen1Pokedex),
		typechart: buildTypechart(tables.typechart, tables.gen1Typechart),
	};
}

export type { BuildDuelmonDatasetOptions, ShowdownTables };
export default buildDuelmonDataset;
