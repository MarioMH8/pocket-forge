import Either from '@hexadrop/either';
import type { CombatantGroup } from '@pocket-forge/combat/domain';
import type { CombatCompositionHook, CombatRuleData, CombatRulePrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatRule, CombatRuleError } from '@pocket-forge/combat-engine/domain';

/**
 * Generic composition constraints declared by a Combat Composition Rule.
 *
 * Constraints describe how many Combatant Groups a format requires and how
 * many Combatants each group may hold. They never reference Moves, actions, or
 * victory conditions.
 */
interface CombatGroupConstraints {
	/**
	 * Maximum number of Combatants allowed in a single group.
	 */
	readonly maxCombatantsPerGroup: number;
	/**
	 * Maximum number of groups allowed in a combat.
	 */
	readonly maxGroups: number;
	/**
	 * Minimum number of Combatants required in a single group.
	 */
	readonly minCombatantsPerGroup: number;
	/**
	 * Minimum number of groups required in a combat.
	 */
	readonly minGroups: number;
}

const CONSTRAINT_FIELDS = ['maxCombatantsPerGroup', 'maxGroups', 'minCombatantsPerGroup', 'minGroups'] as const;

/**
 * Plain, serializable representation of a Combat Composition Rule.
 */
interface CombatCompositionRulePrimitives extends CombatRulePrimitives {
	/**
	 * Composition constraints declared by the concrete rule.
	 */
	readonly groupConstraints: CombatGroupConstraints;
}

/**
 * Base class for rules that validate combat composition.
 *
 * A composition rule owns its format attributes and its group constraints. The
 * concrete class is the identity; authors extend this class and declare their
 * own constraints.
 */
abstract class CombatCompositionRule extends CombatRule implements CombatCompositionHook {
	/**
	 * Composition constraints declared by the concrete rule.
	 */
	readonly groupConstraints: CombatGroupConstraints;

	protected constructor(data: CombatRuleData, groupConstraints: CombatGroupConstraints) {
		super(data);
		this.groupConstraints = groupConstraints;
	}

	/**
	 * Validates authored constraints against the constraints declared by the
	 * concrete rule.
	 *
	 * @param constraints - Authored constraints.
	 * @param expected - Constraints declared by the concrete rule.
	 * @returns Every mismatch, aggregated.
	 */
	protected static validateConstraints(
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
	private static validateGroups(
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

	/**
	 * Serializes this rule into its primitive representation.
	 *
	 * @returns A plain {@link CombatCompositionRulePrimitives} snapshot.
	 */
	override toPrimitives(): CombatCompositionRulePrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			groupConstraints: { ...this.groupConstraints },
		};
	}

	/**
	 * Validates groups against the declared composition constraints.
	 *
	 * @param groups - Groups that will participate in the combat.
	 * @returns No value on success, or every violated constraint.
	 */
	validateComposition(groups: readonly CombatantGroup[]): Either<CombatRuleError[], void> {
		return CombatCompositionRule.validateGroups(groups, this.groupConstraints);
	}
}

export type { CombatCompositionRulePrimitives, CombatGroupConstraints };
export default CombatCompositionRule;
