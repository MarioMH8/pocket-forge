/**
 * Domain port that validates the contract version declared by a Combat Ruleset.
 *
 * The domain only knows that a ruleset declares a compatible contract version;
 * the concrete scheme (for example, semver) is provided by an infrastructure
 * adapter. This keeps third-party version libraries out of the domain layer.
 */
export default interface ContractVersionValidator {
	/**
	 * Checks whether a contract version is valid for the configured scheme.
	 *
	 * @param version - Contract version declared by the ruleset primitives.
	 * @returns `true` when the version is valid.
	 */
	isValid(version: string): boolean;
}
