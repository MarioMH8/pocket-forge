import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { DuelmonType } from '@pocket-forge/duelmon-dataset';
import { DuelmonTypes } from '@pocket-forge/duelmon-dataset';
import type { Species, SpeciesPrimitives } from '@pocket-forge/species/domain';

import type { Gen1BaseStats } from '../action/use-move/gen1/battle-stats';
import { DuelmonAttributeReader } from '../support/duelmon-attribute-reader';

/**
 * Semantic view of a neutral catalog Species.
 *
 * The view assumes the catalog validated the attributes and hides the raw
 * attribute map behind typed getters.
 */
class DuelmonSpecies {
	/**
	 * Stable species identifier.
	 */
	readonly id: string;
	private cachedAttributes: DuelmonSpeciesAttributes | undefined;
	private readonly values: AttributeValues;

	private constructor(primitives: SpeciesPrimitives) {
		this.id = primitives.id;
		this.values = primitives.attributes;
	}

	/**
	 * Typed semantic attributes of the Species.
	 */
	get attributes(): DuelmonSpeciesAttributes {
		this.cachedAttributes ??= this.readAttributes();

		return this.cachedAttributes;
	}

	/**
	 * Base Attack.
	 */
	get baseAtk(): number {
		return this.attributes.baseAtk;
	}

	/**
	 * Base Defense.
	 */
	get baseDef(): number {
		return this.attributes.baseDef;
	}

	/**
	 * Base HP.
	 */
	get baseHp(): number {
		return this.attributes.baseHp;
	}

	/**
	 * Base Special.
	 */
	get baseSpecial(): number {
		return this.attributes.baseSpecial;
	}

	/**
	 * Base Speed.
	 */
	get baseSpeed(): number {
		return this.attributes.baseSpeed;
	}

	/**
	 * Gen 1 types of the Species.
	 */
	get types(): readonly DuelmonType[] {
		return this.attributes.types;
	}

	/**
	 * Builds a view from a Species snapshot.
	 *
	 * @param primitives - Species primitives already validated at write time.
	 * @returns The semantic view.
	 */
	static fromPrimitives(primitives: SpeciesPrimitives): DuelmonSpecies {
		return new DuelmonSpecies(primitives);
	}

	/**
	 * Builds a view from a neutral catalog Species.
	 *
	 * @param species - Validated neutral Species.
	 * @returns The semantic view.
	 */
	static fromSpecies(species: Species): DuelmonSpecies {
		return new DuelmonSpecies(species.toPrimitives());
	}

	/**
	 * Base stats in the shape the Gen 1 stat formula consumes.
	 *
	 * @returns The species base stats.
	 */
	baseStats(): Gen1BaseStats {
		const attributes = this.attributes;

		return {
			baseAtk: attributes.baseAtk,
			baseDef: attributes.baseDef,
			baseHp: attributes.baseHp,
			baseSpecial: attributes.baseSpecial,
			baseSpeed: attributes.baseSpeed,
		};
	}

	/**
	 * Serializes the wrapped Species snapshot.
	 *
	 * @returns The Species primitives.
	 */
	toPrimitives(): SpeciesPrimitives {
		return { attributes: { ...this.values }, id: this.id };
	}

	private readAttributes(): DuelmonSpeciesAttributes {
		const context = `DuelmonSpecies "${this.id}"`;

		return {
			baseAtk: DuelmonAttributeReader.number(this.values, 'baseAtk', context),
			baseDef: DuelmonAttributeReader.number(this.values, 'baseDef', context),
			baseHp: DuelmonAttributeReader.number(this.values, 'baseHp', context),
			baseSpecial: DuelmonAttributeReader.number(this.values, 'baseSpecial', context),
			baseSpeed: DuelmonAttributeReader.number(this.values, 'baseSpeed', context),
			types: this.readTypes(),
		};
	}

	private readTypes(): readonly DuelmonType[] {
		const value = this.values['types'];

		if (!Array.isArray(value)) {
			throw new InvalidArgumentError(`DuelmonSpecies "${this.id}" requires an array "types"`, 'DuelmonSpecies');
		}

		const types: DuelmonType[] = [];

		for (const type of value) {
			if (!DuelmonTypes.is(type)) {
				throw new InvalidArgumentError(
					`DuelmonSpecies "${this.id}" has an invalid "types" attribute`,
					'DuelmonSpecies'
				);
			}

			types.push(type);
		}

		return types;
	}
}

/**
 * Typed semantic attributes of a Species.
 */
interface DuelmonSpeciesAttributes {
	readonly baseAtk: number;
	readonly baseDef: number;
	readonly baseHp: number;
	readonly baseSpecial: number;
	readonly baseSpeed: number;
	readonly types: readonly DuelmonType[];
}

export type { DuelmonSpeciesAttributes };
export { DuelmonSpecies };

export default DuelmonSpecies;
