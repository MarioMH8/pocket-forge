import type { Move } from '@pocket-forge/move/domain';

/**
 * Phase 1 move-support policy.
 *
 * Phase 1 only starts combats with damaging moves that always hit, have zero
 * priority, and carry no primary status, stat-stage change, or secondary
 * effect. The catalog maps those declarations into the neutral Move, so the
 * policy never reads the private dataset.
 */
class Phase1MoveConstraints {
	/**
	 * Explains why a move cannot start a Phase 1 combat.
	 *
	 * @param move - Neutral catalog move.
	 * @returns The unsupported reason, or `undefined` when the move is supported.
	 * @example
	 * ```ts
	 * Phase1MoveConstraints.unsupportedReason(tackle); // undefined
	 * Phase1MoveConstraints.unsupportedReason(oath); // 'Move "oath" is a Status move...'
	 * ```
	 */
	static unsupportedReason(move: Move): string | undefined {
		const values = move.attributes.toPrimitives();

		if (values['category'] === 'Status') {
			return `Move "${move.id}" is a Status move, which is outside Phase 1`;
		}

		const power = values['power'];

		if (typeof power !== 'number' || power < 1) {
			return `Move "${move.id}" has no base power, which is outside Phase 1`;
		}

		const accuracy = values['accuracy'];

		if (typeof accuracy !== 'number' || accuracy < 100) {
			return `Move "${move.id}" can miss, which is outside Phase 1`;
		}

		const priority = values['priority'];

		if (priority !== 0) {
			return `Move "${move.id}" has non-zero priority, which is outside Phase 1`;
		}

		if (values['status'] !== undefined) {
			return `Move "${move.id}" applies a primary status, which is outside Phase 1`;
		}

		if (values['volatileStatus'] !== undefined) {
			return `Move "${move.id}" applies a volatile status, which is outside Phase 1`;
		}

		if (values['secondary'] !== undefined) {
			return `Move "${move.id}" has a secondary effect, which is outside Phase 1`;
		}

		if (values['boosts'] !== undefined) {
			return `Move "${move.id}" changes stat stages, which is outside Phase 1`;
		}

		if (values['drain'] !== undefined) {
			return `Move "${move.id}" drains damage, which is outside Phase 1`;
		}

		if (values['recoil'] !== undefined) {
			return `Move "${move.id}" recoils damage, which is outside Phase 1`;
		}

		if (values['multihit'] !== undefined) {
			return `Move "${move.id}" hits multiple times, which is outside Phase 1`;
		}

		const critRatio = values['critRatio'];

		if (typeof critRatio === 'number' && critRatio > 1) {
			return `Move "${move.id}" has a high critical-hit ratio, which is outside Phase 1`;
		}

		return undefined;
	}
}

export { Phase1MoveConstraints };

export default Phase1MoveConstraints;
