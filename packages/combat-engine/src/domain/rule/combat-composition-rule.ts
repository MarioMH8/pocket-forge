import type Either from '@hexadrop/either';
import type { CombatantGroup } from '@pocket-forge/combat/domain';

import type { CombatCompositionHook } from './combat-composition.hook';
import { validateGroupComposition } from './combat-composition.hook';
import type CombatGroupConstraints from './combat-group-constraints';
import CombatRule from './combat-rule';
import type CombatRuleError from './combat-rule.error';
import type { CombatRuleData, CombatRulePrimitives } from './combat-rule.types';

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
		return validateGroupComposition(groups, this.groupConstraints);
	}
}

export type { CombatCompositionRulePrimitives };
export default CombatCompositionRule;
