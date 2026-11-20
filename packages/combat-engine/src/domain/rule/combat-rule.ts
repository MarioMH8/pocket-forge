import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import type CombatCompletionHook from './combat-completion.hook';
import type { CombatCompositionHook } from './combat-composition.hook';
import CombatRuleError from './combat-rule.error';
import type { CombatRuleData, CombatRulePrimitives } from './combat-rule.types';

/**
 * Abstract, authored Combat Rule.
 *
 * A rule carries its own configuration and participates in a combat through
 * one or more hooks. The concrete class is the identity. The engine composes
 * several rules and invokes the hook each rule implements.
 *
 * Concrete rules extend this class and implement a hook. The built-in rules
 * live in `./rules`; authors can also extend this class with their own rule.
 */
abstract class CombatRule {
	/**
	 * Validated rule configuration.
	 */
	readonly attributes: AttributeMap;
	/**
	 * Definitions used to validate {@link CombatRule.attributes}.
	 */
	readonly definitions: readonly AttributeDefinition[];

	protected constructor(data: CombatRuleData) {
		this.attributes = data.attributes;
		this.definitions = data.definitions;
	}

	/**
	 * Validates primitives against the supplied definitions.
	 *
	 * Every key must have a definition, every required definition must have a
	 * value or default, and every value must satisfy its definition. Failures
	 * are aggregated, never thrown.
	 *
	 * @param primitives - Serialized rule data.
	 * @param definitions - Definitions that govern the rule attributes.
	 * @returns Validated data, or every validation failure.
	 */
	protected static validate(
		primitives: CombatRulePrimitives,
		definitions: readonly AttributeDefinition[]
	): Either<CombatRuleError[], CombatRuleData> {
		const errors = this.validateAttributes(primitives.attributes, definitions);

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right({
			attributes: AttributeMap.create(primitives.attributes, [...definitions], 'CombatRule'),
			definitions: Object.freeze([...definitions]),
		});
	}

	private static validateAttributes(
		attributes: AttributeValues,
		definitions: readonly AttributeDefinition[]
	): CombatRuleError[] {
		const errors: CombatRuleError[] = [];
		const definitionMap = new Map(definitions.map(definition => [definition.key, definition]));

		for (const key of Object.keys(attributes)) {
			if (!definitionMap.has(key)) {
				errors.push(
					new CombatRuleError(
						'invalid-attribute',
						`No definition found for attribute "${key}"`,
						`attributes.${key}`
					)
				);
			}
		}

		for (const definition of definitions) {
			const raw = attributes[definition.key];

			if (raw === undefined && !definition.required) {
				continue;
			}

			const value = raw ?? definition.defaultValue;

			if (value === undefined) {
				errors.push(
					new CombatRuleError(
						'invalid-attribute',
						`Attribute "${definition.key}" is required but no value or default was provided`,
						`attributes.${definition.key}`
					)
				);
				continue;
			}

			const error = definition.validateValue(value);

			if (error) {
				errors.push(
					new CombatRuleError(
						'invalid-attribute',
						`Invalid value for attribute "${definition.key}": ${error.message}`,
						`attributes.${definition.key}`
					)
				);
			}
		}

		return errors;
	}

	/**
	 * Serializes this rule into its primitive representation.
	 *
	 * Definitions are not serialized: they are catalog-owned and supplied again
	 * when hydrating.
	 *
	 * @returns A plain {@link CombatRulePrimitives} snapshot.
	 */
	toPrimitives(): CombatRulePrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
		};
	}
}

/**
 * Narrows a rule to one that validates combat composition.
 *
 * @param rule - Rule to inspect.
 * @returns Whether the rule implements {@link CombatCompositionHook}.
 */
function isCompositionHook(rule: CombatRule): rule is CombatCompositionHook & CombatRule {
	return 'validateComposition' in rule && typeof rule.validateComposition === 'function';
}

/**
 * Narrows a rule to one that evaluates combat completion.
 *
 * @param rule - Rule to inspect.
 * @returns Whether the rule implements {@link CombatCompletionHook}.
 */
function isCompletionHook(rule: CombatRule): rule is CombatCompletionHook & CombatRule {
	return 'evaluate' in rule && typeof rule.evaluate === 'function';
}

export { isCompletionHook, isCompositionHook };
export default CombatRule;
