/* eslint-disable no-console */
import { Command } from 'commander';
import { z } from 'zod';

import type { ExtractOptions } from './extract.options';
import { DEFAULT_OUTPUT_LABEL, DEFAULT_SHOWDOWN_COMMIT, extractOptionsSchema } from './extract.options';
import { extractDataset } from './extract-dataset';

interface ExtractCommandInput {
	readonly commit?: string;
	readonly out?: string;
	readonly source?: string;
}

function parseExtractOptions(input: ExtractCommandInput): ExtractOptions {
	const result = extractOptionsSchema.safeParse(input);

	if (!result.success) {
		throw new Error(`Invalid extract options:\n${z.prettifyError(result.error)}`);
	}

	return result.data;
}

function createExtractCommand(): Command {
	return new Command('extract')
		.description('Extract and normalize a pinned Pokémon Showdown Gen 1 dataset.')
		.option('--source <path>', 'Pokémon Showdown checkout or extracted tarball')
		.option('--out <path>', `output file (default: ${DEFAULT_OUTPUT_LABEL})`)
		.option('--commit <sha>', `expected Showdown commit (default: ${DEFAULT_SHOWDOWN_COMMIT})`)
		.action(async (input: ExtractCommandInput) => {
			const summary = await extractDataset(parseExtractOptions(input));

			console.log(`Wrote ${summary.out} (${summary.commit})`);
			console.log(
				`Species: ${String(summary.species)}, moves: ${String(summary.moves)}, ` +
					`types: ${String(summary.types)}, abilities: ${String(summary.abilities)}`
			);
		});
}

export default createExtractCommand;
