import type { Abstract } from '@hexadrop/types/abstract';

/**
 * Branded capability key for a port that cannot be expressed as an abstract class.
 *
 * @typeParam T - Type produced by the capability.
 */
interface CapabilityToken<T> {
	/**
	 * Phantom member: never read at runtime.
	 *
	 * Declared with a bivariant parameter so a specific token is assignable to
	 * `CapabilityToken<unknown>`.
	 */
	readonly __type?: { bivarianceHack(value: T): T }['bivarianceHack'];
	/**
	 * Discriminates a token from an abstract class at runtime.
	 */
	readonly kind: 'capability-token';
	/**
	 * Human-readable capability name.
	 */
	readonly name: string;
}

/**
 * A port that a binding can satisfy: an abstract class or a branded token.
 *
 * @typeParam T - Type produced by the capability.
 */
type Capability<T> = Abstract<T> | CapabilityToken<T>;

/**
 * Creates a branded capability token for a port that is not an abstract class.
 *
 * @param name - Human-readable capability name.
 * @returns A frozen capability token.
 */
function token<T>(name: string): CapabilityToken<T> {
	return Object.freeze({ kind: 'capability-token', name });
}

/**
 * Returns the name of a capability, whether it is an abstract class or a token.
 *
 * @param capability - Capability to name.
 * @returns The class or token name.
 */
function capabilityName<T>(capability: Capability<T>): string {
	return capability.name;
}

export type { Capability, CapabilityToken };
export { capabilityName, token };
