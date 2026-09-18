import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

/**
 * Primitives representation of an Ability snapshot.
 *
 * Mirrors the {@link Ability} shape but replaces the internal
 * {@link AttributeMap} of attributes with a plain {@link AttributeValues} record
 * suitable for serialisation and persistence.
 */
export interface AbilityPrimitives extends Primitives<Omit<Ability, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature ability.
 *
 * Each ability carries a set of validated attribute values that define
 * its gameplay properties — cooldown, duration, effect magnitude, etc.
 * Abilities are created through the {@link Ability.create} factory,
 * which validates all values against their corresponding
 * {@link AttributeDefinition}s.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * import { AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const cooldownDef = AttributeDefinition.create({
 *   key: 'cooldown', type: 'number', defaultValue: 0,
 *   constraints: { min: 0 },
 * });
 *
 * const ability = Ability.create(
 *   'ab-001', 'Intimidate', 'Lowers the foe\'s attack on entry.',
 *   { cooldown: 3 },
 *   [cooldownDef]
 * );
 * console.log(ability.attributes.value.cooldown); // 3
 * ```
 */
export default class Ability<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	/**
	 *Validated attribute values keyed by attribute name.
	 */
	readonly attributes: AttributeMap<T>;
	/**
	 *Human-readable flavour or lore text.
	 */
	readonly description: string;
	/**
	 *Unique catalog identifier for this ability.
	 */
	readonly id: string;
	/**
	 *Display name shown in the UI.
	 */
	readonly name: string;

	private constructor(attributes: AttributeMap<T>, description: string, id: string, name: string) {
		this.attributes = attributes;
		this.description = description;
		this.id = id;
		this.name = name;
	}

	/**
	 * Creates an Ability with validated attribute values.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param description - Flavour or lore text (may be empty).
	 * @param values - Typed attribute values to assign to this ability.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Ability instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         value lacks a definition or fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		name: string,
		description: string,
		values: T,
		definitions: AttributeDefinition[]
	): Ability<T> {
		if (!id) {
			throw new InvalidArgumentError('Ability id is required', 'Ability');
		}
		if (!name) {
			throw new InvalidArgumentError('Ability name is required', 'Ability');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Ability');

		return new Ability(attributeMap, description, id, name);
	}

	/**
	 * Hydrates an Ability from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing an Ability from a persistence layer where
	 * the data was already validated at write time.
	 *
	 * @param primitives - An {@link AbilityPrimitives} snapshot.
	 * @returns A rehydrated Ability instance.
	 */
	static fromPrimitives(primitives: AbilityPrimitives): Ability {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Ability(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Serialises this Ability into a plain {@link AbilityPrimitives} object.
	 */
	toPrimitives(): AbilityPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
