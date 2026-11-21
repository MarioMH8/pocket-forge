import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type { CombatRuleData, CombatRuleError } from '@pocket-forge/combat-engine/domain';

import type { CombatCompositionRulePrimitives, CombatGroupConstraints } from './combat-composition-rule';
import CombatCompositionRule from './combat-composition-rule';

/**
 * Built-in `1v1` combat rule: exactly two groups with one combatant each.
 *
 * The class is the identity. Hydration goes through the base rule validation
 * and the declared composition constraints.
 */
class OneVersusOneCombatRule extends CombatCompositionRule {
	/**
	 * Composition constraints declared by the `1v1` format.
	 */
	static readonly CONSTRAINTS: CombatGroupConstraints = {
		maxCombatantsPerGroup: 1,
		maxGroups: 2,
		minCombatantsPerGroup: 1,
		minGroups: 2,
	};

	private constructor(data: CombatRuleData, groupConstraints: CombatGroupConstraints) {
		super(data, groupConstraints);
	}

	/**
	 * Hydrates a `1v1` rule from primitives.
	 *
	 * @param primitives - Serialized rule data.
	 * @param definitions - Attribute definitions that govern rule attributes.
	 * @returns The hydrated rule, or every validation failure.
	 * @example
	 * ```ts
	 * const result = OneVersusOneCombatRule.create(primitives, definitions);
	 * ```
	 */
	static create(
		primitives: CombatCompositionRulePrimitives,
		definitions: readonly AttributeDefinition[]
	): Either<CombatRuleError[], OneVersusOneCombatRule> {
		const constraintErrors = this.validateConstraints(primitives.groupConstraints, this.CONSTRAINTS);

		if (constraintErrors.length > 0) {
			return Either.left(constraintErrors);
		}

		const validated = this.validate(primitives, definitions);

		if (validated.isLeft()) {
			return Either.left(validated.getLeft());
		}

		return Either.right(new OneVersusOneCombatRule(validated.getRight(), { ...primitives.groupConstraints }));
	}
}

export default OneVersusOneCombatRule;
