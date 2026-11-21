import type Either from '@hexadrop/either';
import type { CombatantGroup } from '@pocket-forge/combat/domain';

import type CombatRuleError from './combat-rule.error';

/**
 * Rule hook that validates the composition of a Combat.
 *
 * A rule implementing this hook decides which groups and combatants the
 * format accepts. It never resolves actions or decides the outcome.
 */
export default interface CombatCompositionHook {
	/**
	 * Validates the groups that will participate in the combat.
	 *
	 * @param groups - Groups to validate.
	 * @returns No value on success, or every violated constraint.
	 */
	validateComposition(groups: readonly CombatantGroup[]): Either<CombatRuleError[], void>;
}
