import type Combat from '../combat';
import type { CombatOutcome } from '../combat-outcome';

/**
 * External rule that decides whether a Combat has reached an outcome.
 *
 * Completion rules are plugin-owned. The neutral contract defines no fixed
 * turn, intent, phase, or team model.
 */
export default interface CombatCompletionRule {
	/**
	 * Exact contract version declared by this completion rule.
	 */
	readonly contractVersion: string;
	/**
	 * Stable completion-rule kind identifier.
	 */
	readonly kind: string;
	/**
	 * Evaluates the current combat snapshot.
	 *
	 * @param combat - Combat snapshot to inspect. Rules must not mutate it.
	 * @returns The reached outcome, or `undefined` while combat continues.
	 */
	evaluate(combat: Combat): CombatOutcome | undefined;
}
