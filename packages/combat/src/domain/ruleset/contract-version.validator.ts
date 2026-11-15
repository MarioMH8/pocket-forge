/**
 * Domain port that validates the contract versions and ranges declared by
 * Combat extensions.
 *
 * The domain only knows that an extension declares a compatible contract
 * version; the concrete scheme (for example, semver) is provided by an
 * infrastructure adapter. This keeps third-party version libraries out of the
 * domain layer.
 */
export default interface ContractVersionValidator {
	/**
	 * Checks whether a contract version is valid for the configured scheme.
	 *
	 * @param version - Exact contract version declared by an extension.
	 * @returns `true` when the version is valid.
	 */
	isValid(version: string): boolean;
	/**
	 * Checks whether a contract version range is valid for the configured
	 * scheme.
	 *
	 * @param range - Range declared by an extension consumer.
	 * @returns `true` when the range is valid.
	 */
	isValidRange(range: string): boolean;
	/**
	 * Checks whether a version falls inside a range.
	 *
	 * @param version - Exact contract version declared by an extension.
	 * @param range - Range declared by an extension consumer.
	 * @returns `true` when the version satisfies the range.
	 */
	satisfies(version: string, range: string): boolean;
}
