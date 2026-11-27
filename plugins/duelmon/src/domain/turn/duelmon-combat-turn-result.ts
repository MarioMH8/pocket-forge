import type { CombatResolution } from '@pocket-forge/combat-engine/domain';

import type { DuelmonCombatTurnAction } from './duelmon-combat-turn-action';

/**
 * Result of resolving one Phase 1 turn.
 *
 * It carries the single aggregated {@link CombatResolution} and the actions the
 * turn actually resolved, in the real resolution order. A declaration the turn
 * skipped or never reached leaves no action here, so the list is the canonical
 * input for the combat history.
 */
class DuelmonCombatTurnResult {
	/**
	 * Resolved actions in the order they ran.
	 */
	readonly actions: readonly DuelmonCombatTurnAction[];
	/**
	 * Single resolution of the turn.
	 */
	readonly resolution: CombatResolution;

	private constructor(resolution: CombatResolution, actions: readonly DuelmonCombatTurnAction[]) {
		this.resolution = resolution;
		this.actions = Object.freeze([...actions]);
		Object.freeze(this);
	}

	/**
	 * Creates an immutable turn result.
	 *
	 * @param resolution - Single resolution of the turn.
	 * @param actions - Resolved actions in the order they ran.
	 * @returns The turn result.
	 */
	static create(resolution: CombatResolution, actions: readonly DuelmonCombatTurnAction[]): DuelmonCombatTurnResult {
		return new DuelmonCombatTurnResult(resolution, actions);
	}
}

export { DuelmonCombatTurnResult };

export default DuelmonCombatTurnResult;
