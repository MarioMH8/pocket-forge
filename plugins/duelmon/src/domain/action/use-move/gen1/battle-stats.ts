import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionEntity } from '@pocket-forge/attribute/domain';
import type { Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError, CombatResolutionErrorReason } from '@pocket-forge/combat-engine/domain';
import { CombatResolutionError as CombatResolutionErrorValue } from '@pocket-forge/combat-engine/domain';

import { DuelmonCombatAttributes } from '../../../support/combat-attributes';

const BATTLE_STAT_KEYS = ['level', 'hp', 'attack', 'defense', 'special'] as const;

type Gen1BattleStatKey = (typeof BATTLE_STAT_KEYS)[number];

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
	 * Reads the Gen 1 battle stats from a combatant's attributes.
	 *
	 * @param combatant - Combatant whose attributes are read.
	 * @param reason - Failure reason to report when a stat is missing.
	 * @returns The battle stats, or one failure per missing numeric attribute.
	 * @example
	 * ```ts
	 * const stats = Gen1BattleStats.fromCombatant(combatant).getRight();
	 *
	 * stats.level; // 50
	 * stats.special; // 120
	 * ```
	 */
	static fromCombatant(
		combatant: Combatant,
		reason: CombatResolutionErrorReason = 'invalid-input'
	): Either<CombatResolutionError[], Gen1BattleStats> {
		const values = combatant.attributes.toPrimitives();
		const errors: CombatResolutionError[] = [];
		const stats: Partial<Record<Gen1BattleStatKey, number>> = {};

		for (const key of BATTLE_STAT_KEYS) {
			const value = DuelmonCombatAttributes.readNumber(values, key);

			if (value === undefined) {
				errors.push(
					new CombatResolutionErrorValue(
						reason,
						`Combatant "${combatant.id}" is missing numeric "${key}" attribute`,
						`combatants.${combatant.id}.${key}`
					)
				);
				continue;
			}

			stats[key] = value;
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(
			new Gen1BattleStats(
				stats.level ?? 0,
				stats.hp ?? 0,
				stats.attack ?? 0,
				stats.defense ?? 0,
				stats.special ?? 0
			)
		);
	}
}

export { Gen1BattleStats };

export default Gen1BattleStats;
