import type Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';

import type CombatRuleset from './combat-ruleset';
import type CombatRulesetError from './combat-ruleset.error';
import type { CombatRulesetPrimitives } from './combat-ruleset.types';

/**
 * Hydrates a concrete Combat Ruleset from primitive data.
 *
 * Implementations live in the packages that own each format, because only
 * they know their `kind`, `contractVersion`, and composition constraints.
 */
export default interface CombatRulesetFactory<T extends CombatRuleset = CombatRuleset> {
	/**
	 * Rebuilds a ruleset, validating it against the concrete implementation.
	 *
	 * @param primitives - Serialized ruleset data.
	 * @param definitions - Attribute definitions that govern format attributes.
	 * @returns The validated ruleset, or every validation failure.
	 */
	create(primitives: CombatRulesetPrimitives, definitions: AttributeDefinition[]): Either<CombatRulesetError[], T>;
}
