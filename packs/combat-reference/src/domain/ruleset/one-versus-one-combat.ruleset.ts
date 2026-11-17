import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type {
	CombatGroupConstraints,
	CombatRulesetData,
	CombatRulesetError,
	CombatRulesetPrimitives,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { CombatRuleset } from '@pocket-forge/combat/domain';

/**
 * Reference `1v1` combat format: exactly two groups with one combatant each.
 *
 * The class is the source of truth for its `kind`, contract version, and
 * composition constraints. Hydration goes through {@link CombatRuleset.validate}
 * so serialized data is checked against this contract.
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

	/**
	 * Stable format identifier.
	 */
	static readonly KIND = '1v1';
	/**
	 * Exact contract version of this ruleset implementation.
	 */
	static readonly VERSION = '1.0.0';

	/**
	 * Exact contract version declared by this ruleset.
	 */
	readonly contractVersion = OneVersusOneCombatRuleset.VERSION;
	/**
	 * Concrete format identifier.
	 */
	readonly kind = OneVersusOneCombatRuleset.KIND;

	private constructor(data: CombatRulesetData) {
		super(data);
	}

	/**
	 * Validates primitives against the `1v1` contract and hydrates a ruleset.
	 *
	 * @param primitives - Serialized ruleset data.
	 * @param definitions - Attribute definitions that govern format attributes.
	 * @param versionValidator - Domain port that validates the version scheme.
	 * @returns The hydrated ruleset, or every validation failure.
	 */
	static create(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[],
		versionValidator: ContractVersionValidator
	): Either<CombatRulesetError[], OneVersusOneCombatRuleset> {
		return this.validate(
			primitives,
			definitions,
			{
				contractVersion: this.VERSION,
				groupConstraints: this.CONSTRAINTS,
				kind: this.KIND,
			},
			versionValidator
		).mapRight(data => new OneVersusOneCombatRuleset(data));
	}
}

export default OneVersusOneCombatRuleset;
