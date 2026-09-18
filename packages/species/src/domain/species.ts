import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

/**
 * Primitives representation of a Species snapshot.
 *
 * Mirrors the {@link Species} shape but replaces the internal
 * {@link AttributeMap} of attributes with a plain {@link AttributeValues} record
 * suitable for serialisation and persistence.
 */
export interface SpeciesPrimitives extends Primitives<Omit<Species, 'attributes'>> {
	readonly attributes: AttributeValues;
}

/**
 * An immutable catalog entry describing a creature species.
 *
 * Each species carries a set of validated attribute values that define
 * baseline stats, traits, or other gameplay properties shared by every
 * creature of that species. Species are created through the
 * {@link Species.create} factory, which validates all values against
 * their corresponding {@link AttributeDefinition}s.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 *
 * @example
 * ```ts
 * import { AttributeDefinition } from '@pocket-forge/attribute/domain';
 *
 * const hpDef = AttributeDefinition.create({
 *   key: 'baseHp', type: 'number', defaultValue: 10,
 *   constraints: { min: 1, max: 255 },
 * });
 *
 * const species = Species.create(
 *   'sp-001', 'Pyrofox', 'A fire-aligned fox species.',
 *   { baseHp: 45 },
 *   [hpDef]
 * );
 * console.log(species.attributes.value.baseHp); // 45
 * ```
 */
export default class Species<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	/**
	 *Validated attribute values keyed by attribute name.
	 */
	readonly attributes: AttributeMap<T>;
	/**
	 *Human-readable flavour or lore text.
	 */
	readonly description: string;
	/**
	 *Unique catalog identifier for this species.
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
	 * Creates a Species with validated attribute values.
	 *
	 * Every key in `values` must have a matching entry in `definitions`,
	 * and its value must satisfy the definition's constraints.
	 *
	 * @param id - Unique catalog identifier. Must be non-empty.
	 * @param name - Display name. Must be non-empty.
	 * @param description - Flavour or lore text (may be empty).
	 * @param values - Typed attribute values to assign to this species.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Species instance.
	 * @throws {InvalidArgumentError} When `id` or `name` is empty, or when any
	 *         value lacks a definition or fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		name: string,
		description: string,
		values: T,
		definitions: AttributeDefinition[]
	): Species<T> {
		if (!id) {
			throw new InvalidArgumentError('Species id is required', 'Species');
		}
		if (!name) {
			throw new InvalidArgumentError('Species name is required', 'Species');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Species');

		return new Species(attributeMap, description, id, name);
	}

	/**
	 * Hydrates a Species from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing a Species from a persistence layer where
	 * the data was already validated at write time.
	 *
	 * @param primitives - A {@link SpeciesPrimitives} snapshot.
	 * @returns A rehydrated Species instance.
	 */
	static fromPrimitives(primitives: SpeciesPrimitives): Species {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Species(attributeMap, primitives.description, primitives.id, primitives.name);
	}

	/**
	 * Serialises this Species into a plain {@link SpeciesPrimitives} object.
	 */
	toPrimitives(): SpeciesPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			description: this.description,
			id: this.id,
			name: this.name,
		};
	}
}
