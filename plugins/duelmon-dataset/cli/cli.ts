import process from 'node:process';

import { Command } from 'commander';

import extractCommand from './extract';

function createCli(): Command {
	return new Command()
		.name('duelmon-dataset')
		.description('Pokémon Showdown Gen 1 dataset tooling for Duelmon.')
		.addCommand(extractCommand())
		.showHelpAfterError();
}

async function runCli(argv: readonly string[] = process.argv): Promise<void> {
	await createCli().parseAsync([...argv]);
}

export default runCli;
