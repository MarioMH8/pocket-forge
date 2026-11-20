import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type {
	CombatCompositionRulePrimitives,
	CombatGroupConstraints,
	CombatRuleData,
	CombatRuleError,
} from '@pocket-forge/combat-engine/domain';
import { CombatCompositionRule } from '@pocket-forge/combat-engine/domain';

/**
 * Built-in `2v2` combat rule: exactly two groups with two combatants each.
 *
 * The class is the identity. Hydration goes through the base rule validation
 * and the declared composition constraints.
 */
class TwoVersusTwoCombatRule extends CombatCompositionRule {
	/**
	 * Composition constraints declared by the `2v2` format.
	 */
	static readonly CONSTRAINTS: CombatGroupConstraints = {
		maxCombatantsPerGroup: 2,
		maxGroups: 2,
		minCombatantsPerGroup: 2,
		minGroups: 2,
	};

	private constructor(data: CombatRuleData, groupConstraints: CombatGroupConstraints) {
		super(data, groupConstraints);
	}

	/**
	 * Hydrates a `2v2` rule from primitives.
	 *
	 * @param primitives - Serialized rule data.
	 * @param definitions - Attribute definitions that govern rule attributes.
	 * @returns The hydrated rule, or every validation failure.
	 * @example
	 * ```ts
	 * const result = TwoVersusTwoCombatRule.create(primitives, definitions);
	 * ```
	 */
	static create(
		primitives: CombatCompositionRulePrimitives,
		definitions: readonly AttributeDefinition[]
	): Either<CombatRuleError[], TwoVersusTwoCombatRule> {
		const constraintErrors = this.validateConstraints(primitives.groupConstraints, this.CONSTRAINTS);

		if (constraintErrors.length > 0) {
			return Either.left(constraintErrors);
		}

		const validated = this.validate(primitives, definitions);

		if (validated.isLeft()) {
			return Either.left(validated.getLeft());
		}

		return Either.right(new TwoVersusTwoCombatRule(validated.getRight(), { ...primitives.groupConstraints }));
	}
}

export default TwoVersusTwoCombatRule;
