import Either from '@hexadrop/either';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type RandomPocket from '@pocket-forge/rng/domain';

import type { UseMoveInput, UseMoveMechanics, UseMoveOutcome } from '../use-move.mechanics';
import { Gen1BattleStats } from './battle-stats';
import { Gen1Damage } from './damage';

const MIN_RANDOM_FACTOR = 217;
const MAX_RANDOM_FACTOR = 255;
const PERCENT = 100;

/**
 * Gen 1 implementation of the `useMove` mechanics seam.
 *
 * Gen 1 reads level, HP, Attack, Defense, and Special from combatant
 * attributes, checks accuracy with a percentage draw, and calculates damage
 * with the original integer truncation order and the 217–255 random factor.
 */
class Gen1UseMoveMechanics implements UseMoveMechanics {
	/**
	 * Resolves one Gen 1 damaging hit.
	 *
	 * @param input - Combatants, move attributes, and type data already resolved.
	 * @param randomPocket - Randomness state at the start of the hit.
	 * @returns The hit result and the advanced randomness, or missing stat failures.
	 */
	resolve(input: UseMoveInput, randomPocket: RandomPocket): Either<CombatResolutionError[], UseMoveOutcome> {
		const attackerStats = Gen1BattleStats.fromCombatant(input.attacker, 'invalid-input');

		if (attackerStats.isLeft()) {
			return Either.left(attackerStats.getLeft());
		}

		const targetStats = Gen1BattleStats.fromCombatant(input.target, 'invalid-target');

		if (targetStats.isLeft()) {
			return Either.left(targetStats.getLeft());
		}

		let nextRandomPocket = randomPocket;

		if (!input.move.alwaysHits) {
			const [hit, afterAccuracy] = nextRandomPocket.chance(input.move.accuracy / PERCENT);
			nextRandomPocket = afterAccuracy;

			if (!hit) {
				return Either.right({ damage: 0, hit: false, randomPocket: nextRandomPocket });
			}
		}

		const [randomFactor, afterDamage] = nextRandomPocket.nextInt(MIN_RANDOM_FACTOR, MAX_RANDOM_FACTOR);
		const stats = attackerStats.getRight();
		const defender = targetStats.getRight();
		const isPhysical = input.move.category === 'Physical';
		const damage = Gen1Damage.calculate({
			attack: isPhysical ? stats.attack : stats.special,
			defense: isPhysical ? defender.defense : defender.special,
			level: stats.level,
			power: input.move.power,
			randomFactor,
			stab: input.attackerTypes.includes(input.move.type),
			typeMultipliers: input.typeMultipliers,
		}).amount;

		return Either.right({ damage, hit: true, randomPocket: afterDamage });
	}
}

export { Gen1UseMoveMechanics };

export default Gen1UseMoveMechanics;
