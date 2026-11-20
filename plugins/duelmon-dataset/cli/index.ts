import process from 'node:process';

import cli from './cli';

try {
	await cli();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
