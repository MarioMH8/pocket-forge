import type { Combat } from '@pocket-forge/combat/domain';

import type CombatOutcome from '../combat-outcome';

/**
 * Rule hook that decides whether a Combat has reached an outcome.
 *
 * A rule implementing this hook observes the combat snapshot and returns an
 * outcome when it considers the combat finished. It never mutates the combat.
 */
export default interface CombatCompletionHook {
	/**
	 * Evaluates whether the combat has reached completion.
	 *
	 * @param combat - Combat snapshot to inspect. Implementations must not mutate it.
	 * @returns The reached outcome, or `undefined` while combat continues.
	 */
	evaluateCompletion(combat: Combat): CombatOutcome | undefined;
}
