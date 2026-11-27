import type Either from '@hexadrop/either';
import type { Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonMoveCategory, DuelmonType } from '@pocket-forge/duelmon-dataset';
import type RandomPocket from '@pocket-forge/rng/domain';

/**
 * Move attributes required by the generation-specific mechanics.
 */
interface UseMoveAttributes {
	/**
	 * Accuracy percentage, from 1 to 100.
	 */
	readonly accuracy: number;
	/**
	 * Whether the move skips the accuracy draw.
	 */
	readonly alwaysHits: boolean;
	/**
	 * Damage category that selects the offensive and defensive stats.
	 */
	readonly category: DuelmonMoveCategory;
	/**
	 * Move base power.
	 */
	readonly power: number;
	/**
	 * Move type.
	 */
	readonly type: DuelmonType;
}

/**
 * Everything a generation needs to resolve one damaging hit.
 */
interface UseMoveInput {
	/**
	 * Combatant using the move.
	 */
	readonly attacker: Combatant;
	/**
	 * Types of the attacker's species.
	 */
	readonly attackerTypes: readonly DuelmonType[];
	/**
	 * Move being used.
	 */
	readonly move: UseMoveAttributes;
	/**
	 * Combatant receiving the move.
	 */
	readonly target: Combatant;
	/**
	 * One type multiplier per defending type, in order.
	 */
	readonly typeMultipliers: readonly number[];
}

/**
 * Result of one generation-specific move resolution.
 */
interface UseMoveOutcome {
	/**
	 * Damage dealt. Zero when the move missed.
	 */
	readonly damage: number;
	/**
	 * Whether the move passed its accuracy check.
	 */
	readonly hit: boolean;
	/**
	 * Randomness state after every draw the generation performed.
	 */
	readonly randomPocket: RandomPocket;
}

/**
 * Generation-specific seam for the `useMove` action.
 *
 * The generation-agnostic action owns targeting, catalog lookups, immunity
 * ordering, events, and the target HP update. A mechanics implementation owns
 * how battle stats are read, whether the move hits, how damage is calculated,
 * and which randomness it consumes, so a new generation only adds a new
 * implementation.
 */
interface UseMoveMechanics {
	/**
	 * Resolves one damaging hit for the generation.
	 *
	 * @param input - Combatants, move attributes, and type data already resolved.
	 * @param randomPocket - Randomness state at the start of the hit.
	 * @returns The hit result and the advanced randomness, or structured failures.
	 */
	resolve(input: UseMoveInput, randomPocket: RandomPocket): Either<CombatResolutionError[], UseMoveOutcome>;
}

export type { UseMoveAttributes, UseMoveInput, UseMoveMechanics, UseMoveOutcome };
