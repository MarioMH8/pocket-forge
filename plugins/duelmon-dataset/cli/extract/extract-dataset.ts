import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DuelmonDatasetBuilder } from '@pocket-forge/duelmon-dataset';

import type { ExtractOptions } from './extract.options';
import { ShowdownSource } from './showdown-source';

interface ExtractDatasetSummary {
	readonly abilities: number;
	readonly commit: string;
	readonly moves: number;
	readonly out: string;
	readonly species: number;
	readonly types: number;
}

/**
 * Builds the curated dataset from a Showdown source and writes it to disk.
 */
class ExtractDataset {
	/**
	 * Extracts the dataset and writes it to the requested output path.
	 *
	 * @param options - Validated extraction options.
	 * @returns A summary of the written dataset.
	 */
	static async run(options: ExtractOptions): Promise<ExtractDatasetSummary> {
		const tables = await ShowdownSource.loadTables(options.source);
		const commit = await ShowdownSource.resolveCommit(options.source, options.commit);
		const dataset = DuelmonDatasetBuilder.build({ commit, tables });

		await mkdir(path.dirname(options.out), { recursive: true });
		await writeFile(options.out, `${JSON.stringify(dataset, undefined, 2)}\n`, 'utf8');

		return {
			abilities: dataset.abilities.length,
			commit,
			moves: dataset.moves.length,
			out: options.out,
			species: dataset.species.length,
			types: Object.keys(dataset.typechart).length,
		};
	}
}

export type { ExtractDatasetSummary };
export { ExtractDataset };

export default ExtractDataset;
