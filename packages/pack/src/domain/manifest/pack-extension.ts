/**
 * Compiled module that a Pack declares for one extension point.
 */
export default interface PackExtensionDeclaration {
	/**
	 * Exact contract version the module implements.
	 */
	readonly contractVersion: string;
	/**
	 * Identity of the extension within its point.
	 */
	readonly id: string;
	/**
	 * Module path relative to the Pack root.
	 */
	readonly module: string;
	/**
	 * Extension point the module implements.
	 */
	readonly point: string;
}
