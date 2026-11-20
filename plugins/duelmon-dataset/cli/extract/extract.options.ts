import path from 'node:path';

import { z } from 'zod';

/**
 * Showdown commit pinned by the extraction workflow.
 */
const DEFAULT_SHOWDOWN_COMMIT = 'c23d2e942c9c0daadb13a7162a385bf78e3c9353';

/**
 * Default dataset output, relative to the package root.
 */
const DEFAULT_OUTPUT_LABEL = 'data/generated/dataset.json';

const DEFAULT_OUTPUT_PATH = path.resolve(import.meta.dir, '../..', DEFAULT_OUTPUT_LABEL);

const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Validated options accepted by the `extract` command.
 */
const extractOptionsSchema = z.object({
	commit: z
		.string()
		.trim()
		.regex(GIT_SHA_PATTERN, '--commit must be a full 40-character lowercase Git SHA')
		.default(DEFAULT_SHOWDOWN_COMMIT),
	out: z
		.string()
		.trim()
		.min(1, '--out requires a path')
		.default(DEFAULT_OUTPUT_PATH)
		.transform(value => path.resolve(value)),
	source: z
		.string({ error: '--source requires a Pokémon Showdown checkout path' })
		.trim()
		.min(1, '--source requires a Pokémon Showdown checkout path')
		.transform(value => path.resolve(value)),
});

type ExtractOptions = z.infer<typeof extractOptionsSchema>;

export { DEFAULT_OUTPUT_LABEL, DEFAULT_OUTPUT_PATH, DEFAULT_SHOWDOWN_COMMIT, extractOptionsSchema };
export type { ExtractOptions };
