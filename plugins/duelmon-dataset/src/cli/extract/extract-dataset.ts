import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DuelmonDatasetBuilder } from '../../duelmon-dataset.builder';
import type { ExtractOptions } from './extract.options';
import { loadShowdownTables, resolveShowdownCommit } from './showdown-source';

export interface ExtractDatasetSummary {
	readonly abilities: number;
	readonly commit: string;
	readonly moves: number;
	readonly out: string;
	readonly species: number;
	readonly types: number;
}

export async function extractDataset(options: ExtractOptions): Promise<ExtractDatasetSummary> {
	const tables = await loadShowdownTables(options.source);
	const commit = await resolveShowdownCommit(options.source, options.commit);
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
