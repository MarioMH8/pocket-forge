import type { ContentIndex } from '../content';
import type { Capability } from './capability';

/**
 * A capability paired with a factory that builds its implementation from content.
 *
 * @typeParam T - Type produced by the capability.
 */
export default interface Binding<T = unknown> {
	/**
	 * Capability this binding satisfies.
	 */
	readonly capability: Capability<T>;
	/**
	 * Factory that receives the resolved content index.
	 */
	readonly create: (content: ContentIndex) => T;
}
