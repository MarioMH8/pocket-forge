/* eslint-disable no-console */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import type { ShowdownTables } from '../src/dataset/build-duelmon-dataset';
import buildDuelmonDataset from '../src/dataset/build-duelmon-dataset';

const SHOWDOWN_COMMIT = 'c23d2e942c9c0daadb13a7162a385bf78e3c9353';
const DEFAULT_OUT = path.resolve(import.meta.dir, '../data/generated/dataset.json');

interface CliOptions {
	readonly out: string;
	readonly source: string;
}

function parseArguments(argv: readonly string[]): CliOptions {
	let source: string | undefined;
	let out = DEFAULT_OUT;

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === undefined) {
			break;
		}

		if (argument === '--source') {
			source = argv[index + 1];
			index += 1;
		} else if (argument === '--out') {
			out = argv[index + 1] ?? '';
			index += 1;
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}

	if (!source) {
		throw new Error('Usage: bun run extract --source <showdown-checkout> [--out <path>]');
	}

	if (out.length === 0) {
		throw new Error('--out requires a path');
	}

	return { out: path.resolve(out), source: path.resolve(source) };
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

async function main(): Promise<void> {
	const { out, source } = parseArguments(process.argv.slice(2));
	const tables = await loadTables(source);
	const dataset = buildDuelmonDataset({ commit: SHOWDOWN_COMMIT, tables });

	await mkdir(path.dirname(out), { recursive: true });
	await writeFile(out, `${JSON.stringify(dataset, undefined, 2)}\n`, 'utf8');

	console.log(`Wrote ${out}`);
	console.log(
		`Species: ${String(dataset.species.length)}, moves: ${String(dataset.moves.length)}, ` +
			`types: ${String(Object.keys(dataset.typechart).length)}, ` +
			`abilities: ${String(dataset.abilities.length)}`
	);
}

await main();
