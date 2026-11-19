import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type {
	CombatGroupConstraints,
	CombatRulesetData,
	CombatRulesetError,
	CombatRulesetPrimitives,
} from '@pocket-forge/combat-engine/domain';
import { CombatRuleset } from '@pocket-forge/combat-engine/domain';

/**
 * Built-in `1v1` combat format: exactly two groups with one combatant each.
 *
 * The class is the source of truth for its composition constraints. Hydration
 * goes through {@link CombatRuleset.validate} so serialized data is checked
 * against this contract.
 */
class OneVersusOneCombatRuleset extends CombatRuleset {
	/**
	 * Composition constraints declared by the `1v1` format.
	 */
	static readonly CONSTRAINTS: CombatGroupConstraints = {
		maxCombatantsPerGroup: 1,
		maxGroups: 2,
		minCombatantsPerGroup: 1,
		minGroups: 2,
	};

	private constructor(data: CombatRulesetData) {
		super(data);
	}

	/**
	 * Validates primitives against the `1v1` contract and hydrates a ruleset.
	 *
	 * @param primitives - Serialized ruleset data.
	 * @param definitions - Attribute definitions that govern format attributes.
	 * @returns The hydrated ruleset, or every validation failure.
	 * @example
	 * ```ts
	 * const result = OneVersusOneCombatRuleset.create(primitives, definitions);
	 *
	 * if (result.isLeft()) {
	 *   console.error(result.getLeft());
	 * }
	 * ```
	 */
	static create(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[]
	): Either<CombatRulesetError[], OneVersusOneCombatRuleset> {
		return this.validate(primitives, definitions, { groupConstraints: this.CONSTRAINTS }).mapRight(
			data => new OneVersusOneCombatRuleset(data)
		);
	}
}

export default OneVersusOneCombatRuleset;
