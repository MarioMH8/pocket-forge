import type { DuelmonMove } from '@pocket-forge/duelmon-dataset';

/**
 * Phase 1 move-support policy.
 *
 * Phase 1 only starts combats with damaging moves that always hit, have zero
 * priority, and carry no primary status, stat-stage change, or secondary
 * effect. The neutral catalog Move drops those effect fields, so the policy is
 * built from the source dataset entries at composition.
 */
class Phase1MoveConstraints {
	private readonly entries: ReadonlyMap<string, DuelmonMove>;

	private constructor(entries: ReadonlyMap<string, DuelmonMove>) {
		this.entries = entries;
	}

	/**
	 * Builds the policy from the dataset entries used by the catalog.
	 *
	 * @param entries - Moves declared by the dataset.
	 * @returns The Phase 1 move-support policy.
	 * @example
	 * ```ts
	 * const constraints = Phase1MoveConstraints.fromMoves(dataset.moves);
	 *
	 * constraints.unsupportedReason('tackle'); // undefined
	 * constraints.unsupportedReason('oath'); // 'Move "oath" is a Status move...'
	 * ```
	 */
	static fromMoves(entries: readonly DuelmonMove[]): Phase1MoveConstraints {
		return new Phase1MoveConstraints(new Map(entries.map(entry => [entry.id, entry])));
	}

	/**
	 * Explains why a move cannot start a Phase 1 combat.
	 *
	 * @param moveId - Move identifier.
	 * @returns The unsupported reason, or `undefined` when the move is supported.
	 */
	unsupportedReason(moveId: string): string | undefined {
		const entry = this.entries.get(moveId);

		if (!entry) {
			return `Move "${moveId}" is not part of the Phase 1 content`;
		}

		if (entry.category === 'Status') {
			return `Move "${entry.id}" is a Status move, which is outside Phase 1`;
		}

		if (entry.power < 1) {
			return `Move "${entry.id}" has no base power, which is outside Phase 1`;
		}

		if (entry.accuracy !== true && entry.accuracy < 100) {
			return `Move "${entry.id}" can miss, which is outside Phase 1`;
		}

		if (entry.priority !== 0) {
			return `Move "${entry.id}" has non-zero priority, which is outside Phase 1`;
		}

		if (entry.status !== undefined) {
			return `Move "${entry.id}" applies a primary status, which is outside Phase 1`;
		}

		if (entry.volatileStatus !== undefined) {
			return `Move "${entry.id}" applies a volatile status, which is outside Phase 1`;
		}

		if (entry.secondary !== undefined) {
			return `Move "${entry.id}" has a secondary effect, which is outside Phase 1`;
		}

		if (entry.boosts !== undefined) {
			return `Move "${entry.id}" changes stat stages, which is outside Phase 1`;
		}

		if (entry.drain !== undefined) {
			return `Move "${entry.id}" drains damage, which is outside Phase 1`;
		}

		if (entry.recoil !== undefined) {
			return `Move "${entry.id}" recoils damage, which is outside Phase 1`;
		}

		if (entry.multihit !== undefined) {
			return `Move "${entry.id}" hits multiple times, which is outside Phase 1`;
		}

		if (entry.critRatio !== undefined && entry.critRatio > 1) {
			return `Move "${entry.id}" has a high critical-hit ratio, which is outside Phase 1`;
		}

		return undefined;
	}
}

export { Phase1MoveConstraints };

export default Phase1MoveConstraints;
