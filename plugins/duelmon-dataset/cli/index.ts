import process from 'node:process';

import { DuelmonDatasetCli } from './cli';

try {
	await DuelmonDatasetCli.run();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
