import type Either from '@hexadrop/either';

import type { Contribution } from '../manifest';
import type PackError from './pack-error';

/**
 * Port that reads one Pack contribution.
 *
 * The resolver owns envelope validation; an adapter only reads and parses the
 * contribution at the given path.
 */
abstract class PackContentReader {
	/**
	 * Reads one contribution relative to a Pack root.
	 *
	 * @param root - Pack root directory.
	 * @param contribution - Contribution to read.
	 * @returns The parsed contribution, or every read failure.
	 */
	abstract read(root: string, contribution: Contribution): Promise<Either<PackError[], unknown>>;
}

export default PackContentReader;
