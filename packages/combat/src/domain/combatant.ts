import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { CreaturePrimitives } from '@pocket-forge/creature/domain';

/**
 * Primitives representation of a Combatant snapshot.
 *
 * Mirrors the {@link Combatant} shape but replaces the internal {@link AttributeMap}
 * with a plain {@link AttributeValues} record for serialization and persistence.
 */
export interface CombatantPrimitives extends Omit<Primitives<Combatant>, 'attributes'> {
	readonly attributes: AttributeValues;
	readonly creature: CreaturePrimitives;
}

/**
 * A combat-local participant that carries a Creature snapshot and its own battle attributes.
 *
 * A Combatant is always created inside a specific {@link CombatantGroup} and cannot
 * exist without one. Its battle attributes start from the creature's attributes
 * but are independent and may diverge during combat.
 *
 * @typeParam T - A record of attribute keys to their {@link AttributeValue} types.
 *                Defaults to `AttributeValues` for untyped hydration.
 */
export default class Combatant<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	readonly attributes: AttributeMap<T>;
	readonly creature: CreaturePrimitives;
	readonly groupId: string;
	readonly id: string;

	private constructor(attributes: AttributeMap<T>, creature: CreaturePrimitives, groupId: string, id: string) {
		this.attributes = attributes;
		this.creature = creature;
		this.groupId = groupId;
		this.id = id;
	}

	/**
	 * Creates a Combatant with validated battle attributes.
	 *
	 * @param id - Unique combatant identifier. Must be non-empty.
	 * @param creature - A {@link CreaturePrimitives} snapshot of the participant's creature.
	 * @param groupId - The ID of the group this combatant belongs to.
	 * @param values - Typed battle attribute values for this combatant.
	 * @param definitions - Attribute definitions that govern the values.
	 * @returns A fully validated Combatant instance.
	 * @throws {InvalidArgumentError} When `id` is empty or any value fails validation.
	 */
	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		creature: CreaturePrimitives,
		groupId: string,
		values: T,
		definitions: AttributeDefinition[]
	): Combatant<T> {
		if (!id) {
			throw new InvalidArgumentError('Combatant id is required', 'Combatant');
		}
		if (!groupId) {
			throw new InvalidArgumentError('Combatant groupId is required', 'Combatant');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Combatant');

		return new Combatant(attributeMap, creature, groupId, id);
	}

	/**
	 * Hydrates a Combatant from a plain primitives object without re-validating.
	 *
	 * Use this when reconstructing a Combatant from persistence where the data
	 * was already validated at write time.
	 *
	 * @param primitives - A {@link CombatantPrimitives} snapshot.
	 * @returns A rehydrated Combatant instance.
	 */
	static fromPrimitives(primitives: CombatantPrimitives): Combatant {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);

		return new Combatant(attributeMap, primitives.creature, primitives.groupId, primitives.id);
	}

	/**
	 * Serializes this Combatant into a plain {@link CombatantPrimitives} object.
	 */
	toPrimitives(): CombatantPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			creature: this.creature,
			groupId: this.groupId,
			id: this.id,
		};
	}
}
