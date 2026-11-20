import Either from '@hexadrop/either';
import type { CombatantGroup } from '@pocket-forge/combat/domain';

import type CombatGroupConstraints from './combat-group-constraints';
import CombatRuleError from './combat-rule.error';

/**
 * Rule hook that validates the composition of a Combat.
 *
 * A rule implementing this hook decides which groups and combatants the
 * format accepts. It never resolves actions or decides the outcome.
 */
interface CombatCompositionHook {
	/**
	 * Validates the groups that will participate in the combat.
	 *
	 * @param groups - Groups to validate.
	 * @returns No value on success, or every violated constraint.
	 */
	validateComposition(groups: readonly CombatantGroup[]): Either<CombatRuleError[], void>;
}

const CONSTRAINT_FIELDS = ['maxCombatantsPerGroup', 'maxGroups', 'minCombatantsPerGroup', 'minGroups'] as const;

/**
 * Validates authored constraints against the contract of a concrete rule.
 *
 * @param constraints - Authored constraints.
 * @param expected - Constraints declared by the concrete rule.
 * @returns Every mismatch, aggregated.
 */
function validateCompositionConstraints(
	constraints: CombatGroupConstraints,
	expected: CombatGroupConstraints
): CombatRuleError[] {
	const errors: CombatRuleError[] = [];

	for (const field of CONSTRAINT_FIELDS) {
		const value = constraints[field];

		if (!Number.isSafeInteger(value)) {
			errors.push(
				new CombatRuleError(
					'invalid-constraints',
					`${field} must be an integer, received ${String(value)}`,
					`groupConstraints.${field}`
				)
			);
			continue;
		}

		if ((field === 'minGroups' || field === 'minCombatantsPerGroup') && value < 1) {
			errors.push(
				new CombatRuleError(
					'invalid-constraints',
					`${field} must be at least 1, received ${String(value)}`,
					`groupConstraints.${field}`
				)
			);
		}

		if (value !== expected[field]) {
			errors.push(
				new CombatRuleError(
					'invalid-constraints',
					`Expected ${field} ${String(expected[field])}, received ${String(value)}`,
					`groupConstraints.${field}`
				)
			);
		}
	}

	if (
		Number.isSafeInteger(constraints.minGroups) &&
		Number.isSafeInteger(constraints.maxGroups) &&
		constraints.minGroups > constraints.maxGroups
	) {
		errors.push(
			new CombatRuleError(
				'invalid-constraints',
				`minGroups ${String(constraints.minGroups)} cannot exceed maxGroups ${String(constraints.maxGroups)}`,
				'groupConstraints.minGroups'
			)
		);
	}

	if (
		Number.isSafeInteger(constraints.minCombatantsPerGroup) &&
		Number.isSafeInteger(constraints.maxCombatantsPerGroup) &&
		constraints.minCombatantsPerGroup > constraints.maxCombatantsPerGroup
	) {
		errors.push(
			new CombatRuleError(
				'invalid-constraints',
				`minCombatantsPerGroup ${String(constraints.minCombatantsPerGroup)} cannot exceed maxCombatantsPerGroup ${String(constraints.maxCombatantsPerGroup)}`,
				'groupConstraints.minCombatantsPerGroup'
			)
		);
	}

	return errors;
}

/**
 * Validates a list of groups against composition constraints.
 *
 * @param groups - Groups that will participate in the combat.
 * @param constraints - Constraints to enforce.
 * @returns No value on success, or every violated constraint.
 */
function validateGroupComposition(
	groups: readonly CombatantGroup[],
	constraints: CombatGroupConstraints
): Either<CombatRuleError[], void> {
	const errors: CombatRuleError[] = [];
	const { maxCombatantsPerGroup, maxGroups, minCombatantsPerGroup, minGroups } = constraints;

	if (groups.length < minGroups) {
		errors.push(
			new CombatRuleError(
				'invalid-constraints',
				`Combat requires at least ${String(minGroups)} group(s), received ${String(groups.length)}`,
				'groups'
			)
		);
	}

	if (groups.length > maxGroups) {
		errors.push(
			new CombatRuleError(
				'invalid-constraints',
				`Combat allows at most ${String(maxGroups)} group(s), received ${String(groups.length)}`,
				'groups'
			)
		);
	}

	for (const [index, group] of groups.entries()) {
		if (group.combatants.length < minCombatantsPerGroup) {
			errors.push(
				new CombatRuleError(
					'invalid-constraints',
					`Group "${group.id}" requires at least ${String(minCombatantsPerGroup)} combatant(s), received ${String(group.combatants.length)}`,
					`groups.${String(index)}.combatants`
				)
			);
		}

		if (group.combatants.length > maxCombatantsPerGroup) {
			errors.push(
				new CombatRuleError(
					'invalid-constraints',
					`Group "${group.id}" allows at most ${String(maxCombatantsPerGroup)} combatant(s), received ${String(group.combatants.length)}`,
					`groups.${String(index)}.combatants`
				)
			);
		}
	}

	if (errors.length > 0) {
		return Either.left(errors);
	}

	return Either.right();
}

export type { CombatCompositionHook };
export { validateCompositionConstraints, validateGroupComposition };
