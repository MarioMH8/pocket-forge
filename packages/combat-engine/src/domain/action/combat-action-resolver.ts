import type Either from '@hexadrop/either';
import type { Combat } from '@pocket-forge/combat/domain';

import type CombatResolutionError from '../combat-resolution.error';
import type CombatTransition from '../combat-transition';
import type CombatActionBindingSet from './combat-action-binding-set';
import type { CombatActionCatalog } from './combat-action-descriptor';

/**
 * Immutable context handed to a Combat Action Resolver.
 */
interface CombatActionContext {
	/**
	 * Action bindings selected by the app.
	 */
	readonly actionBindings: CombatActionBindingSet;
	/**
	 * Combat snapshot to resolve against. Resolvers must not mutate it.
	 */
	readonly combat: Combat;
	/**
	 * Resolver-owned input shape. The neutral contract does not fix it.
	 */
	readonly input: unknown;
}

/**
 * Reusable external logic that resolves bound combat actions.
 *
 * A resolver owns its action catalog and its input shape. Concrete resolvers
 * live outside the neutral contract; the app composes them with the rules and
 * the action bindings.
 */
interface CombatActionResolver {
	/**
	 * Actions registered by this resolver.
	 */
	readonly actions: CombatActionCatalog;
	/**
	 * Resolves one bound action against a Combat.
	 *
	 * Implementations must be pure: rejections leave the input Combat and its
	 * RandomPocket untouched and produce no events.
	 *
	 * @param context - Immutable action context.
	 * @returns The successor transition, or every rejection.
	 */
	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition>;
}

export type { CombatActionContext, CombatActionResolver };
