import type { ContractVersionValidator } from '@pocket-forge/combat/domain';
import { valid } from 'semver';

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
	 * @param version - Contract version declared by the ruleset primitives.
	 * @returns `true` when the version is valid semver.
	 */
	isValid(version: string): boolean {
		return valid(version) !== null;
	}
}
