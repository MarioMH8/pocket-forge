import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combatant } from '@pocket-forge/combat/domain';

import { DuelmonMove } from '../move/duelmon-move';
import { DuelmonSpecies } from '../species/duelmon-species';
import { DuelmonAttributeReader } from '../support/duelmon-attribute-reader';

/**
 * Semantic view of a neutral Combatant.
 *
 * The view assumes the combat start validated the battle attributes. It hides
 * the raw attribute map behind typed getters and never replaces the core
 * Combatant as the source of truth.
 */
class DuelmonCombatant {
	/**
	 * Owning combatant group identifier.
	 */
	readonly groupId: string;
	/**
	 * Stable combatant identifier.
	 */
	readonly id: string;
	private cachedAttributes: DuelmonCombatantAttributes | undefined;
	private readonly combatant: Combatant;
	private readonly values: AttributeValues;

	private constructor(combatant: Combatant) {
		this.id = combatant.id;
		this.groupId = combatant.groupId;
		this.combatant = combatant;
		this.values = combatant.attributes.toPrimitives();
	}

	/**
	 * Physical attack stat.
	 */
	get attack(): number {
		return this.attributes.attack;
	}

	/**
	 * Typed semantic battle attributes of the combatant.
	 */
	get attributes(): DuelmonCombatantAttributes {
		this.cachedAttributes ??= this.readAttributes();

		return this.cachedAttributes;
	}

	/**
	 * Physical defense stat.
	 */
	get defense(): number {
		return this.attributes.defense;
	}

	/**
	 * Current hit points.
	 */
	get hp(): number {
		return this.attributes.hp;
	}

	/**
	 * Whether the combatant has no hit points left.
	 */
	get isFainted(): boolean {
		return this.attributes.hp <= 0;
	}

	/**
	 * Combatant level.
	 */
	get level(): number {
		return this.attributes.level;
	}

	/**
	 * Maximum hit points.
	 */
	get maxHp(): number {
		return this.attributes.maxHp;
	}

	/**
	 * Special attack and special defense stat.
	 */
	get special(): number {
		return this.attributes.special;
	}

	/**
	 * Speed stat.
	 */
	get speed(): number {
		return this.attributes.speed;
	}

	/**
	 * Builds a view from a neutral Combatant.
	 *
	 * @param combatant - Combatant already validated by the combat start.
	 * @returns The semantic view.
	 */
	static fromCombatant(combatant: Combatant): DuelmonCombatant {
		return new DuelmonCombatant(combatant);
	}

	/**
	 * Loadout moves embedded in the creature snapshot.
	 *
	 * @returns The semantic Move views.
	 */
	moves(): readonly DuelmonMove[] {
		return this.combatant.creature.moves.map(move => DuelmonMove.fromPrimitives(move));
	}

	/**
	 * Species embedded in the creature snapshot.
	 *
	 * @returns The semantic Species view.
	 */
	species(): DuelmonSpecies {
		return DuelmonSpecies.fromPrimitives(this.combatant.creature.species);
	}

	private readAttributes(): DuelmonCombatantAttributes {
		const context = `DuelmonCombatant "${this.id}"`;

		return {
			attack: DuelmonAttributeReader.number(this.values, 'attack', context),
			defense: DuelmonAttributeReader.number(this.values, 'defense', context),
			hp: DuelmonAttributeReader.number(this.values, 'hp', context),
			level: DuelmonAttributeReader.number(this.values, 'level', context),
			maxHp: DuelmonAttributeReader.number(this.values, 'maxHp', context),
			special: DuelmonAttributeReader.number(this.values, 'special', context),
			speed: DuelmonAttributeReader.number(this.values, 'speed', context),
		};
	}
}

/**
 * Typed semantic battle attributes of a Combatant.
 */
interface DuelmonCombatantAttributes {
	readonly attack: number;
	readonly defense: number;
	readonly hp: number;
	readonly level: number;
	readonly maxHp: number;
	readonly special: number;
	readonly speed: number;
}

export type { DuelmonCombatantAttributes };
export { DuelmonCombatant };

export default DuelmonCombatant;
