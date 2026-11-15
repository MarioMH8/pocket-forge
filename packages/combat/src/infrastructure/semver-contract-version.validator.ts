import type { ContractVersionValidator } from '@pocket-forge/combat/domain';
import { satisfies, valid, validRange } from 'semver';

/**
 * Infrastructure adapter that validates Combat contract versions with semver.
 *
 * The domain exposes {@link ContractVersionValidator} as a port; this adapter
 * keeps the third-party `semver` dependency outside the domain layer.
 */
export default class SemverContractVersionValidator implements ContractVersionValidator {
	/**
	 * Checks whether the version is a valid semver string.
	 *
	 * @param version - Contract version declared by the extension primitives.
	 * @returns `true` when the version is valid semver.
	 */
	isValid(version: string): boolean {
		return valid(version) !== null;
	}

	/**
	 * Checks whether the range is a valid semver range.
	 *
	 * @param range - Range declared by an extension consumer.
	 * @returns `true` when the range is valid semver.
	 */
	isValidRange(range: string): boolean {
		return validRange(range) !== null;
	}

	/**
	 * Checks whether the version satisfies the range.
	 *
	 * @param version - Exact contract version declared by an extension.
	 * @param range - Range declared by an extension consumer.
	 * @returns `true` when the version satisfies the range.
	 */
	satisfies(version: string, range: string): boolean {
		return satisfies(version, range);
	}
}
