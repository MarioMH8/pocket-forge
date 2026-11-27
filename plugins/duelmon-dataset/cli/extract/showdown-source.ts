import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import type { ShowdownTables } from '@pocket-forge/duelmon-dataset';

const execFileAsync = promisify(execFile);

/**
 * Loads Showdown tables and pins the source commit for dataset extraction.
 */
class ShowdownSource {
	/**
	 * Imports the Showdown tables needed to build the Gen 1 dataset.
	 *
	 * @param source - Showdown checkout or extracted tarball.
	 * @returns The base and Gen 1 Showdown tables.
	 */
	static async loadTables(source: string): Promise<ShowdownTables> {
		const [pokedex, gen1Pokedex, moves, gen1Moves, typechart, gen1Typechart] = await Promise.all([
			this.importTable(source, 'data/pokedex.ts', 'Pokedex'),
			this.importTable(source, 'data/mods/gen1/pokedex.ts', 'Pokedex'),
			this.importTable(source, 'data/moves.ts', 'Moves'),
			this.importTable(source, 'data/mods/gen1/moves.ts', 'Moves'),
			this.importTable(source, 'data/typechart.ts', 'TypeChart'),
			this.importTable(source, 'data/mods/gen1/typechart.ts', 'TypeChart'),
		]);

		return { gen1Moves, gen1Pokedex, gen1Typechart, moves, pokedex, typechart };
	}

	/**
	 * Resolves the Showdown commit the source was extracted from.
	 *
	 * @param source - Showdown checkout or extracted tarball.
	 * @param requested - Commit pinned by the extraction workflow.
	 * @returns The resolved commit.
	 * @throws {Error} When the checkout HEAD does not match the requested commit.
	 */
	static async resolveCommit(source: string, requested: string): Promise<string> {
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

	/**
	 * Imports one named table from a Showdown module.
	 *
	 * @param source - Showdown checkout or extracted tarball.
	 * @param relativePath - Module path relative to the source root.
	 * @param exportName - Expected named export.
	 * @returns The imported table.
	 * @throws {TypeError} When the module or export is missing.
	 */
	private static async importTable(
		source: string,
		relativePath: string,
		exportName: string
	): Promise<Record<string, unknown>> {
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
}

export { ShowdownSource };

export default ShowdownSource;
