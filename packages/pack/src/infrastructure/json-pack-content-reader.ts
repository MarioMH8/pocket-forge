import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Either from '@hexadrop/either';
import type { Contribution, PackError } from '@pocket-forge/pack/domain';
import { PackContentReader, PackError as PackContentError } from '@pocket-forge/pack/domain';

/**
 * JSON contribution reader backed by the Node file system.
 *
 * It uses `readFile` and `JSON.parse` so the adapter runs in both Bun and
 * Electron's Node runtime. Envelope validation belongs to the resolver.
 */
class JsonPackContentReader extends PackContentReader {
	/**
	 * Reads and parses one JSON contribution relative to a Pack root.
	 *
	 * @param root - Pack root directory.
	 * @param contribution - Contribution whose path points to a JSON file.
	 * @returns The parsed JSON value, or a content read failure.
	 */
	async read(root: string, contribution: Contribution): Promise<Either<PackError[], unknown>> {
		try {
			const contents = await readFile(path.join(root, contribution.path), 'utf8');

			return Either.right(JSON.parse(contents) as unknown);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);

			return Either.left([new PackContentError('content-read-failed', message, contribution.path)]);
		}
	}
}

export default JsonPackContentReader;
