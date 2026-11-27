import type { DuelmonMove } from '../move/duelmon-move';

/**
 * Showdown flags that change turn or self-KO behavior and stay outside Phase 1.
 */
const UNSUPPORTED_FLAGS = ['charge', 'mustrecharge', 'noreturn', 'recharge'] as const;

/**
 * Phase 1 move-support policy.
 *
 * Phase 1 only starts combats with damaging moves that always hit, have zero
 * priority, and carry no primary status, stat-stage change, or secondary
 * effect. The semantic Move view hides the attribute keys, so the policy reads
 * domain predicates instead of raw attributes.
 */
class Phase1MoveConstraints {
	/**
	 * Explains why a move cannot start a Phase 1 combat.
	 *
	 * @param move - Semantic view of a neutral catalog move.
	 * @returns The unsupported reason, or `undefined` when the move is supported.
	 * @example
	 * ```ts
	 * Phase1MoveConstraints.unsupportedReason(tackle); // undefined
	 * Phase1MoveConstraints.unsupportedReason(oath); // 'Move "oath" is a Status move...'
	 * ```
	 */
	static unsupportedReason(move: DuelmonMove): string | undefined {
		if (move.isStatus) {
			return `Move "${move.id}" is a Status move, which is outside Phase 1`;
		}

		if (move.power < 1) {
			return `Move "${move.id}" has no base power, which is outside Phase 1`;
		}

		if (move.accuracy < 100) {
			return `Move "${move.id}" can miss, which is outside Phase 1`;
		}

		if (move.priority !== 0) {
			return `Move "${move.id}" has non-zero priority, which is outside Phase 1`;
		}

		if (move.hasPrimaryStatus) {
			return `Move "${move.id}" applies a primary status, which is outside Phase 1`;
		}

		if (move.hasVolatileStatus) {
			return `Move "${move.id}" applies a volatile status, which is outside Phase 1`;
		}

		if (move.hasSecondaryEffect) {
			return `Move "${move.id}" has a secondary effect, which is outside Phase 1`;
		}

		if (move.changesStages) {
			return `Move "${move.id}" changes stat stages, which is outside Phase 1`;
		}

		if (move.drains) {
			return `Move "${move.id}" drains damage, which is outside Phase 1`;
		}

		if (move.recoils) {
			return `Move "${move.id}" recoils damage, which is outside Phase 1`;
		}

		if (move.isMultiHit) {
			return `Move "${move.id}" hits multiple times, which is outside Phase 1`;
		}

		if (move.hasHighCritRatio) {
			return `Move "${move.id}" has a high critical-hit ratio, which is outside Phase 1`;
		}

		for (const flag of UNSUPPORTED_FLAGS) {
			if (move.hasFlag(flag)) {
				return `Move "${move.id}" has the "${flag}" flag, which is outside Phase 1`;
			}
		}

		return undefined;
	}
}

export { Phase1MoveConstraints };

export default Phase1MoveConstraints;
