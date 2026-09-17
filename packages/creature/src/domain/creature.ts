import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AbilityPrimitives } from '@pocket-forge/abilities/domain';
import type { AttributeAssignment, AttributeDefinition, AttributeValues } from '@pocket-forge/attributes/domain';
import {
	hydrateAttributeMap,
	serializeAttributeMap,
	validateAndBuildAttributeMap,
} from '@pocket-forge/attributes/domain';
import type { MovePrimitives } from '@pocket-forge/moves/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';

/**
 * Primitives representation of a Creature snapshot.
 */
export interface CreaturePrimitives {
	readonly abilities: AbilityPrimitives[];
	readonly attributes: AttributeValues;
	readonly id: string;
	readonly moves: MovePrimitives[];
	readonly name: string;
	readonly species: SpeciesPrimitives;
}

/**
 * An immutable creature instance with embedded species, ability, and move snapshots.
 * Carries validated attribute assignments.
 */
export default class Creature {
	readonly abilities: AbilityPrimitives[];
	readonly attributes: ReadonlyMap<string, AttributeAssignment>;
	readonly id: string;
	readonly moves: MovePrimitives[];
	readonly name: string;
	readonly species: SpeciesPrimitives;

	private constructor(
		abilities: AbilityPrimitives[],
		attributes: ReadonlyMap<string, AttributeAssignment>,
		id: string,
		moves: MovePrimitives[],
		name: string,
		species: SpeciesPrimitives
	) {
		this.abilities = abilities;
		this.attributes = attributes;
		this.id = id;
		this.moves = moves;
		this.name = name;
		this.species = species;
	}

	/**
	 * Creates a Creature with validated attribute assignments.
	 */
	static create(
		id: string,
		name: string,
		species: SpeciesPrimitives,
		abilities: AbilityPrimitives[],
		moves: MovePrimitives[],
		assignments: AttributeAssignment[],
		definitions: AttributeDefinition[]
	): Creature {
		if (!id) {
			throw new InvalidArgumentError('Creature id is required', 'Creature');
		}
		if (!name) {
			throw new InvalidArgumentError('Creature name is required', 'Creature');
		}
		// eslint-disable-next-line typescript/no-unnecessary-condition
		if (!species) {
			throw new InvalidArgumentError('Creature species is required', 'Creature');
		}

		const attributeMap = validateAndBuildAttributeMap(assignments, definitions, 'Creature');

		return new Creature(abilities, attributeMap, id, moves, name, species);
	}

	/**
	 * Hydrates from primitives without re-validating (for persistence).
	 */
	static fromPrimitives(primitives: CreaturePrimitives): Creature {
		const attributeMap = hydrateAttributeMap(primitives.attributes);

		return new Creature(
			primitives.abilities,
			attributeMap,
			primitives.id,
			primitives.moves,
			primitives.name,
			primitives.species
		);
	}

	/**
	 * Returns the value of a specific attribute, or undefined if not set.
	 */
	getAttribute(key: string): boolean | boolean[] | number | number[] | string | string[] | undefined {
		return this.attributes.get(key)?.value;
	}

	toPrimitives(): CreaturePrimitives {
		return {
			abilities: this.abilities,
			attributes: serializeAttributeMap(this.attributes),
			id: this.id,
			moves: this.moves,
			name: this.name,
			species: this.species,
		};
	}
}
