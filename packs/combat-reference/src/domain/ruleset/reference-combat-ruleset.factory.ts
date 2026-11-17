import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type {
	CombatRuleset,
	CombatRulesetFactory,
	CombatRulesetPrimitives,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { CombatRulesetError } from '@pocket-forge/combat/domain';

import OneVersusOneCombatRuleset from './one-versus-one-combat.ruleset';
import TwoVersusTwoCombatRuleset from './two-versus-two-combat.ruleset';

/**
 * Hydrates the reference Combat formats by `kind`.
 *
 * The factory injects the {@link ContractVersionValidator} port so the
 * reference package can keep its concrete formats free of a version library.
 */
class ReferenceCombatRulesetFactory implements CombatRulesetFactory {
	private readonly versionValidator: ContractVersionValidator;

	constructor(versionValidator: ContractVersionValidator) {
		this.versionValidator = versionValidator;
	}

	/**
	 * Rebuilds the ruleset declared by the primitives' `kind`.
	 *
	 * @param primitives - Serialized ruleset data.
	 * @param definitions - Attribute definitions that govern format attributes.
	 * @returns The hydrated ruleset, or every validation failure.
	 */
	create(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[]
	): Either<CombatRulesetError[], CombatRuleset> {
		switch (primitives.kind) {
			case OneVersusOneCombatRuleset.KIND: {
				return OneVersusOneCombatRuleset.create(primitives, definitions, this.versionValidator);
			}
			case TwoVersusTwoCombatRuleset.KIND: {
				return TwoVersusTwoCombatRuleset.create(primitives, definitions, this.versionValidator);
			}
			default: {
				return Either.left([
					new CombatRulesetError(
						'invalid-kind',
						`Unknown reference combat ruleset kind "${primitives.kind}"`,
						'kind'
					),
				]);
			}
		}
	}
}

export default ReferenceCombatRulesetFactory;
