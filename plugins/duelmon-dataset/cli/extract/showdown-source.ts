import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import type { ShowdownTables } from '@pocket-forge/duelmon-dataset';

const execFileAsync = promisify(execFile);

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

async function loadShowdownTables(source: string): Promise<ShowdownTables> {
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

async function resolveShowdownCommit(source: string, requested: string): Promise<string> {
	if (!existsSync(path.join(source, '.git'))) {
		console.error('Source is not a git checkout; using the requested commit metadata.');

		return requested;
	}

	const { stdout } = await execFileAsync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
	const actual = stdout.trim();

	if (actual !== requested) {
		throw new Error(`Source HEAD ${actual} does not match the requested commit ${requested}`);
	}

	return actual;
}

export { loadShowdownTables, resolveShowdownCommit };
