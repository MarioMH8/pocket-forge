import process from 'node:process';

import { Command } from 'commander';

import ExtractCommand from './extract';

/**
 * Root command line interface for the dataset tooling.
 */
class DuelmonDatasetCli {
	/**
	 * Builds the root command and registers its subcommands.
	 *
	 * @returns The configured root command.
	 */
	static create(): Command {
		return new Command()
			.name('duelmon-dataset')
			.description('Pokémon Showdown Gen 1 dataset tooling for Duelmon.')
			.addCommand(ExtractCommand.create())
			.showHelpAfterError();
	}

	/**
	 * Runs the command line interface.
	 *
	 * @param argv - Process arguments.
	 * @returns A promise that settles when parsing finishes.
	 */
	static async run(argv: readonly string[] = process.argv): Promise<void> {
		await this.create().parseAsync([...argv]);
	}
}

export { DuelmonDatasetCli };

export default DuelmonDatasetCli;
