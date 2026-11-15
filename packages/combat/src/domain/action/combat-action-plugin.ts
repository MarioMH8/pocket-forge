import type Either from '@hexadrop/either';

import type Combat from '../combat';
import type CombatResolutionError from '../combat-resolution.error';
import type CombatTransition from '../combat-transition';
import type { CombatActionCatalog } from './combat-action';
import type CombatActionSet from './combat-action-set';

/**
 * Immutable context handed to a Combat Action Plugin when resolving an action.
 */
interface CombatActionContext {
	/**
	 * Action set that selected the action.
	 */
	readonly actionSet: CombatActionSet;
	/**
	 * Current combat snapshot. Plugins must not mutate it.
	 */
	readonly combat: Combat;
	/**
	 * Plugin-owned input shape. The neutral contract never fixes turns,
	 * intents, phases, or teams.
	 */
	readonly input: unknown;
}

/**
 * Reusable external rule logic that registers combat actions and resolves
 * them into Combat Transitions.
 *
 * Concrete plugins live outside the Combat core. They own their action
 * catalog, their input shape, their rules, and their completion rules.
 */
interface CombatActionPlugin {
	/**
	 * Actions registered by this plugin.
	 */
	readonly actions: CombatActionCatalog;
	/**
	 * Exact contract version declared by this plugin.
	 */
	readonly contractVersion: string;
	/**
	 * Stable plugin identifier.
	 */
	readonly id: string;
	/**
	 * Resolves an action into a successor combat snapshot and ordered events.
	 *
	 * Implementations must be pure: rejected resolutions return
	 * {@link CombatResolutionError} values, leave the previous snapshot
	 * unchanged, and consume no randomness.
	 *
	 * @param context - Immutable action context.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition>;
	/**
	 * Checks whether an action set targets this plugin and accepts its version.
	 *
	 * @param actionSet - Authored action set to check.
	 * @returns `true` when the plugin id matches and the set's semver range
	 *          accepts the plugin's exact version.
	 */
	supports(actionSet: CombatActionSet): boolean;
}

export type { CombatActionContext, CombatActionPlugin };
