import type { Combat } from '@pocket-forge/combat/domain';

import type { CombatOutcome } from '../combat-outcome';

/**
 * Rule hook that decides whether a Combat has reached an outcome.
 *
 * A rule implementing this hook observes the combat snapshot and returns an
 * outcome when it considers the combat finished. It never mutates the combat.
 */
export default interface CombatCompletionHook {
	/**
	 * Evaluates the current combat snapshot.
	 *
	 * @param combat - Combat snapshot to inspect. Implementations must not mutate it.
	 * @returns The reached outcome, or `undefined` while combat continues.
	 */
	evaluate(combat: Combat): CombatOutcome | undefined;
}
