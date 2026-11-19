/* eslint-disable no-console */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import type { ShowdownTables } from '@pocket-forge/duelmon/dataset';
import { DuelmonDatasetBuilder } from '@pocket-forge/duelmon/dataset';

const SHOWDOWN_COMMIT = 'c23d2e942c9c0daadb13a7162a385bf78e3c9353';
const DEFAULT_OUT = path.resolve(import.meta.dir, '../data/generated/dataset.json');
const execFileAsync = promisify(execFile);

interface CliOptions {
	readonly commit: string;
	readonly out: string;
	readonly source: string;
}

type OptionField = 'commit' | 'out' | 'source';

const OPTION_FIELDS = new Map<string, OptionField>([
	['--commit', 'commit'],
	['--out', 'out'],
	['--source', 'source'],
]);

function parseArguments(argv: readonly string[]): CliOptions {
	const state: Record<OptionField, string | undefined> = {
		commit: SHOWDOWN_COMMIT,
		out: DEFAULT_OUT,
		source: undefined,
	};
	let index = 0;

	while (index < argv.length) {
		const option = argv[index] ?? '';
		const value = argv[index + 1];
		const field = OPTION_FIELDS.get(option);

		if (field === undefined) {
			throw new Error(`Unknown argument: ${option}`);
		}

		state[field] = value;
		index += 2;
	}

	const commit = state.commit ?? '';
	const out = state.out ?? '';
	const source = state.source;

	if (!source) {
		throw new Error('Usage: bun run extract --source <showdown-checkout> [--out <path>] [--commit <sha>]');
	}

	if (out.length === 0) {
		throw new Error('--out requires a path');
	}

	if (commit.trim().length === 0) {
		throw new Error('--commit requires a commit');
	}

	return { commit, out: path.resolve(out), source: path.resolve(source) };
}

async function importTable(source: string, relativePath: string, exportName: string): Promise<Record<string, unknown>> {
	const sourceUrl = pathToFileURL(source).href;
	const module = (await import(`${sourceUrl}/${relativePath}`)) as unknown;

	if (typeof module !== 'object' || module === null) {
		throw new TypeError(`${relativePath} did not export a module`);
	}

	const table = (module as Record<string, unknown>)[exportName];

	if (typeof table !== 'object' || table === null || Array.isArray(table)) {
		throw new TypeError(`${relativePath} does not export ${exportName}`);
	}

	return table as Record<string, unknown>;
}

async function loadTables(source: string): Promise<ShowdownTables> {
	const [pokedex, gen1Pokedex, moves, gen1Moves, typechart, gen1Typechart] = await Promise.all([
		importTable(source, 'data/pokedex.ts', 'Pokedex'),
		importTable(source, 'data/mods/gen1/pokedex.ts', 'Pokedex'),
		importTable(source, 'data/moves.ts', 'Moves'),
		importTable(source, 'data/mods/gen1/moves.ts', 'Moves'),
		importTable(source, 'data/typechart.ts', 'TypeChart'),
		importTable(source, 'data/mods/gen1/typechart.ts', 'TypeChart'),
	]);

	return { gen1Moves, gen1Pokedex, gen1Typechart, moves, pokedex, typechart };
}

async function resolveCommit(source: string, requested: string): Promise<string> {
	if (!existsSync(path.join(source, '.git'))) {
		console.warn('Source is not a git checkout; using the requested commit metadata.');

		return requested;
	}

	const { stdout } = await execFileAsync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
	const actual = stdout.trim();

	if (actual !== requested) {
		throw new Error(`Source HEAD ${actual} does not match the requested commit ${requested}`);
	}

	return actual;
}

async function main(): Promise<void> {
	const options = parseArguments(process.argv.slice(2));
	const tables = await loadTables(options.source);
	const commit = await resolveCommit(options.source, options.commit);
	const dataset = DuelmonDatasetBuilder.build({ commit, tables });

	await mkdir(path.dirname(options.out), { recursive: true });
	await writeFile(options.out, `${JSON.stringify(dataset, undefined, 2)}\n`, 'utf8');

	console.log(`Wrote ${options.out}`);
	console.log(
		`Species: ${String(dataset.species.length)}, moves: ${String(dataset.moves.length)}, ` +
			`types: ${String(Object.keys(dataset.typechart).length)}, ` +
			`abilities: ${String(dataset.abilities.length)}`
	);
}

await main();
