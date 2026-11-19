import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import type CombatantGroup from '../combatant-group';
import type CombatGroupConstraints from './combat-group-constraints';
import CombatRulesetError from './combat-ruleset.error';
import type { CombatRulesetData, CombatRulesetPrimitives } from './combat-ruleset.types';

/**
 * The composition expected by a concrete Combat Ruleset implementation.
 */
interface CombatRulesetContract {
	readonly groupConstraints: CombatGroupConstraints;
}

const CONSTRAINT_FIELDS = ['maxCombatantsPerGroup', 'maxGroups', 'minCombatantsPerGroup', 'minGroups'] as const;

/**
 * Abstract, authored Combat Ruleset.
 *
 * A ruleset describes a combat *format*: its identity, optional format
 * attributes, and generic composition constraints. It knows nothing about
 * Moves, actions, completion rules, or victory.
 *
 * Concrete formats (`1v1`, `2v2`, …) declare their own composition constraints
 * and expose an own `static create` that delegates to
 * {@link CombatRuleset.validate}. The built-in formats live in `./rulesets`;
 * authors can also extend this class with their own format.
 */
abstract class CombatRuleset {
	/**
	 * Validated format attribute values.
	 */
	readonly attributes: AttributeMap;
	/**
	 * Definitions used to validate {@link CombatRuleset.attributes}.
	 */
	readonly definitions: readonly AttributeDefinition[];
	/**
	 * Composition constraints declared by the concrete format.
	 */
	readonly groupConstraints: CombatGroupConstraints;
	/**
	 * Unique ruleset identifier.
	 */
	readonly id: string;

	protected constructor(data: CombatRulesetData) {
		this.attributes = data.attributes;
		this.definitions = data.definitions;
		this.groupConstraints = data.groupConstraints;
		this.id = data.id;
	}

	/**
	 * Validates primitives against a concrete ruleset contract.
	 *
	 * The concrete class is the source of truth: every composition constraint
	 * must match the expected contract. Failures are aggregated, never thrown.
	 *
	 * @param primitives - Serialized ruleset data.
	 * @param definitions - Attribute definitions that govern format attributes.
	 * @param expected - Contract declared by the concrete implementation.
	 * @returns Validated data, or every validation failure.
	 */
	protected static validate(
		primitives: CombatRulesetPrimitives,
		definitions: AttributeDefinition[],
		expected: CombatRulesetContract
	): Either<CombatRulesetError[], CombatRulesetData> {
		const errors: CombatRulesetError[] = [];

		this.validateIdentity(primitives, errors);
		this.validateConstraints(primitives.groupConstraints, expected.groupConstraints, errors);
		errors.push(...this.validateAttributes(primitives.attributes, definitions));

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right({
			attributes: AttributeMap.create(primitives.attributes, definitions, 'CombatRuleset'),
			definitions: Object.freeze([...definitions]),
			groupConstraints: Object.freeze({ ...primitives.groupConstraints }),
			id: primitives.id,
		});
	}

	private static isNonEmpty(value: string): boolean {
		return typeof value === 'string' && value.trim().length > 0;
	}

	private static validateAttributes(
		attributes: AttributeValues,
		definitions: readonly AttributeDefinition[]
	): CombatRulesetError[] {
		const errors: CombatRulesetError[] = [];
		const definitionMap = new Map(definitions.map(definition => [definition.key, definition]));

		for (const key of Object.keys(attributes)) {
			if (!definitionMap.has(key)) {
				errors.push(
					new CombatRulesetError(
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
					new CombatRulesetError(
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
					new CombatRulesetError(
						'invalid-attribute',
						`Invalid value for attribute "${definition.key}": ${error.message}`,
						`attributes.${definition.key}`
					)
				);
			}
		}

		return errors;
	}

	private static validateConstraints(
		constraints: CombatGroupConstraints,
		expected: CombatGroupConstraints,
		errors: CombatRulesetError[]
	): void {
		for (const field of CONSTRAINT_FIELDS) {
			const value = constraints[field];

			if (!Number.isSafeInteger(value)) {
				errors.push(
					new CombatRulesetError(
						'invalid-constraints',
						`${field} must be an integer, received ${String(value)}`,
						`groupConstraints.${field}`
					)
				);
				continue;
			}

			if ((field === 'minGroups' || field === 'minCombatantsPerGroup') && value < 1) {
				errors.push(
					new CombatRulesetError(
						'invalid-constraints',
						`${field} must be at least 1, received ${String(value)}`,
						`groupConstraints.${field}`
					)
				);
			}

			if (value !== expected[field]) {
				errors.push(
					new CombatRulesetError(
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
				new CombatRulesetError(
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
				new CombatRulesetError(
					'invalid-constraints',
					`minCombatantsPerGroup ${String(constraints.minCombatantsPerGroup)} cannot exceed maxCombatantsPerGroup ${String(constraints.maxCombatantsPerGroup)}`,
					'groupConstraints.minCombatantsPerGroup'
				)
			);
		}
	}

	private static validateIdentity(primitives: CombatRulesetPrimitives, errors: CombatRulesetError[]): void {
		if (!this.isNonEmpty(primitives.id)) {
			errors.push(new CombatRulesetError('invalid-id', 'Combat ruleset id is required', 'id'));
		}
	}

	/**
	 * Serializes this ruleset into its primitive representation.
	 *
	 * Definitions are not serialized: they are catalog-owned and supplied again
	 * when hydrating.
	 *
	 * @returns A plain {@link CombatRulesetPrimitives} snapshot.
	 */
	toPrimitives(): CombatRulesetPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			groupConstraints: { ...this.groupConstraints },
			id: this.id,
		};
	}

	/**
	 * Validates a list of groups against the declared composition constraints.
	 *
	 * Concrete rulesets may override this method to add format-specific
	 * composition rules. Membership and identity checks belong to `Combat`.
	 *
	 * @param groups - Groups that will participate in the combat.
	 * @returns No value on success, or every violated constraint.
	 */
	validateGroups(groups: readonly CombatantGroup[]): Either<CombatRulesetError[], void> {
		const errors: CombatRulesetError[] = [];
		const { maxCombatantsPerGroup, maxGroups, minCombatantsPerGroup, minGroups } = this.groupConstraints;

		if (groups.length < minGroups) {
			errors.push(
				new CombatRulesetError(
					'invalid-constraints',
					`Combat requires at least ${String(minGroups)} group(s), received ${String(groups.length)}`,
					'groups'
				)
			);
		}

		if (groups.length > maxGroups) {
			errors.push(
				new CombatRulesetError(
					'invalid-constraints',
					`Combat allows at most ${String(maxGroups)} group(s), received ${String(groups.length)}`,
					'groups'
				)
			);
		}

		for (const [index, group] of groups.entries()) {
			if (group.combatants.length < minCombatantsPerGroup) {
				errors.push(
					new CombatRulesetError(
						'invalid-constraints',
						`Group "${group.id}" requires at least ${String(minCombatantsPerGroup)} combatant(s), received ${String(group.combatants.length)}`,
						`groups.${String(index)}.combatants`
					)
				);
			}

			if (group.combatants.length > maxCombatantsPerGroup) {
				errors.push(
					new CombatRulesetError(
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
}

export type { CombatRulesetContract };
export default CombatRuleset;
