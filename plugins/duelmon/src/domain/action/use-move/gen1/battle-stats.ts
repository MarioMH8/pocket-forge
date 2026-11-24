import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionEntity } from '@pocket-forge/attribute/domain';
import type { Combatant } from '@pocket-forge/combat/domain';

import { DuelmonCombatant } from '../../../combat/duelmon-combatant';

/**
 * Base stats read from a species to derive the initial battle values.
 */
interface Gen1BaseStats {
	readonly baseAtk: number;
	readonly baseDef: number;
	readonly baseHp: number;
	readonly baseSpecial: number;
	readonly baseSpeed: number;
}

/**
 * Battle attributes derived for a combatant at the start of a Gen 1 battle.
 */
interface Gen1DerivedStats {
	readonly attack: number;
	readonly defense: number;
	readonly hp: number;
	readonly level: number;
	readonly maxHp: number;
	readonly special: number;
	readonly speed: number;
}

/**
 * Initial individual and effort values.
 *
 * Phase 1 fixes both at zero; they return when progression owns them.
 */
const INITIAL_IV = 0;
const INITIAL_EV = 0;

/**
 * Battle stats used by the Gen 1 damage formula.
 */
class Gen1BattleStats {
	/**
	 * Attributes required from every combatant in a Gen 1 battle.
	 */
	static readonly DEFINITIONS: readonly AttributeDefinition[] = Object.freeze([
		AttributeDefinitionEntity.create({
			constraints: { max: 100, min: 1 },
			key: 'level',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 0 },
			key: 'hp',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 1 },
			key: 'maxHp',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 1 },
			key: 'attack',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 1 },
			key: 'defense',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 1 },
			key: 'special',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 999, min: 1 },
			key: 'speed',
			required: true,
			type: 'number',
		}),
	]);

	/**
	 * Attributes required from every combatant group in a Gen 1 battle.
	 */
	static readonly GROUP_DEFINITIONS: readonly AttributeDefinition[] = Object.freeze([
		AttributeDefinitionEntity.create({
			constraints: { itemType: 'string', maxLength: 2, minLength: 1 },
			key: 'activeCombatantIds',
			required: true,
			type: 'array',
		}),
	]);

	/**
	 * Physical attack stat.
	 */
	readonly attack: number;
	/**
	 * Physical defense stat.
	 */
	readonly defense: number;
	/**
	 * Current hit points.
	 */
	readonly hp: number;
	/**
	 * Combatant level.
	 */
	readonly level: number;
	/**
	 * Special attack and special defense stat.
	 */
	readonly special: number;

	private constructor(level: number, hp: number, attack: number, defense: number, special: number) {
		this.level = level;
		this.hp = hp;
		this.attack = attack;
		this.defense = defense;
		this.special = special;
	}

	/**
	 * Derives the initial battle stats of a species.
	 *
	 * Uses the Gen 1 HP and stat formulas with zero IVs and EVs. The derived
	 * `hp` and `maxHp` start equal; no other battle state is produced.
	 *
	 * @param base - Species base stats.
	 * @param level - Combatant level.
	 * @returns The derived battle attributes.
	 * @example
	 * ```ts
	 * const stats = Gen1BattleStats.derive({ baseHp: 39, baseAtk: 52, baseDef: 43, baseSpecial: 50, baseSpeed: 65 }, 50);
	 *
	 * stats.hp; // 99
	 * stats.speed; // 70
	 * ```
	 */
	static derive(base: Gen1BaseStats, level: number): Gen1DerivedStats {
		const hp = this.deriveHp(base.baseHp, level);

		return {
			attack: this.deriveStat(base.baseAtk, level),
			defense: this.deriveStat(base.baseDef, level),
			hp,
			level,
			maxHp: hp,
			special: this.deriveStat(base.baseSpecial, level),
			speed: this.deriveStat(base.baseSpeed, level),
		};
	}

	/**
	 * Reads the Gen 1 battle stats from a combatant.
	 *
	 * @param combatant - Combatant whose battle attributes are read.
	 * @returns The battle stats.
	 * @example
	 * ```ts
	 * const stats = Gen1BattleStats.fromCombatant(combatant);
	 *
	 * stats.level; // 50
	 * stats.special; // 120
	 * ```
	 */
	static fromCombatant(combatant: Combatant): Gen1BattleStats {
		const view = DuelmonCombatant.fromCombatant(combatant);

		return new Gen1BattleStats(view.level, view.hp, view.attack, view.defense, view.special);
	}

	private static deriveHp(baseHp: number, level: number): number {
		return (
			Math.floor((((baseHp + INITIAL_IV) * 2 + Math.floor(Math.sqrt(INITIAL_EV) / 4)) * level) / 100) + level + 10
		);
	}

	private static deriveStat(baseStat: number, level: number): number {
		return Math.floor((((baseStat + INITIAL_IV) * 2 + Math.floor(Math.sqrt(INITIAL_EV) / 4)) * level) / 100) + 5;
	}
}

export type { Gen1BaseStats, Gen1DerivedStats };
export { Gen1BattleStats };

export default Gen1BattleStats;
