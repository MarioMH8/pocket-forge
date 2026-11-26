import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Combat } from '@pocket-forge/combat/domain';

import { DuelmonCombat } from '../combat/duelmon-combat';
import type { DuelmonCombatant } from '../combat/duelmon-combatant';

/**
 * Phase 1 combatant order.
 *
 * The order is total, deterministic, and independent of the input order: the
 * faster combatant goes first, and equal Speed is broken by the combatant
 * position in the Combat. Speed is always read from the combatant battle state
 * through {@link DuelmonCombatant.speed}; priority, stat stages, paralysis, and
 * randomness do not participate.
 *
 * The order is built once from a Combat and reused, so a turn can sort the
 * combatants of its declarations without rebuilding the combat state.
 *
 * @example
 * ```ts
 * const order = DuelmonSpeedOrder.fromCombat(combat);
 * const [first, second] = order.sort([defender, attacker]);
 * ```
 */
class DuelmonSpeedOrder {
	private readonly positions: ReadonlyMap<string, number>;

	private constructor(positions: ReadonlyMap<string, number>) {
		this.positions = positions;
	}

	/**
	 * Builds the order from a Combat snapshot.
	 *
	 * The combatant position follows the Combat: the order of its groups and,
	 * within each group, the order of its combatants. It includes reserves so
	 * the same order can compare any combatant of the combat.
	 *
	 * @param combat - Combat already validated by the combat start.
	 * @returns The Phase 1 speed order for that combat.
	 */
	static fromCombat(combat: Combat): DuelmonSpeedOrder {
		const positions = new Map<string, number>();
		let position = 0;

		for (const group of DuelmonCombat.fromCombat(combat).groups()) {
			for (const combatant of group.combatants()) {
				positions.set(combatant.id, position);
				position += 1;
			}
		}

		return new DuelmonSpeedOrder(positions);
	}

	/**
	 * Compares two combatants of the same combat.
	 *
	 * Higher Speed comes first. Equal Speed falls back to the combatant position
	 * in the Combat, which is unique, so the result never depends on the order of
	 * the compared values.
	 *
	 * @param left - Left combatant.
	 * @param right - Right combatant.
	 * @returns A negative number when `left` goes first, a positive number when
	 * `right` goes first, and zero when both are the same combatant.
	 * @throws {InvalidArgumentError} When a combatant does not belong to the
	 * combat that defines this order.
	 */
	compare(left: DuelmonCombatant, right: DuelmonCombatant): number {
		if (left.id === right.id) {
			return 0;
		}

		const bySpeed = right.speed - left.speed;

		if (bySpeed !== 0) {
			return bySpeed;
		}

		return this.position(left) - this.position(right);
	}

	/**
	 * Sorts combatants of this combat by Phase 1 speed order.
	 *
	 * The input array is never mutated, and the comparator is a total order, so
	 * the result is reproducible for the same starting point.
	 *
	 * @param combatants - Combatants to order.
	 * @returns A new frozen array with the fastest combatant first.
	 * @throws {InvalidArgumentError} When a combatant does not belong to the
	 * combat that defines this order.
	 */
	sort(combatants: readonly DuelmonCombatant[]): readonly DuelmonCombatant[] {
		return Object.freeze(combatants.toSorted((left, right) => this.compare(left, right)));
	}

	private position(combatant: DuelmonCombatant): number {
		const position = this.positions.get(combatant.id);

		if (position === undefined) {
			throw new InvalidArgumentError(
				`Combatant "${combatant.id}" does not belong to the combat of this speed order`,
				'DuelmonSpeedOrder'
			);
		}

		return position;
	}
}

export { DuelmonSpeedOrder };

export default DuelmonSpeedOrder;
