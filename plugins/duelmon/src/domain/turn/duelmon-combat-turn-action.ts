import type { Combat } from '@pocket-forge/combat/domain';

/**
 * One action the turn actually resolved.
 *
 * The action carries the declared actor, Move, and target identifiers together
 * with the successor `Combat` snapshot produced while resolving it. The turn
 * result exposes these actions in the order they ran, so callers never have to
 * infer the order from the merged events.
 */
class DuelmonCombatTurnAction {
	/**
	 * Acting combatant identifier.
	 */
	readonly actorId: string;
	/**
	 * Successor snapshot produced by the action.
	 */
	readonly combat: Combat;
	/**
	 * Resolved Move identifier.
	 */
	readonly moveId: string;
	/**
	 * Target combatant identifier.
	 */
	readonly targetId: string;

	private constructor(actorId: string, moveId: string, targetId: string, combat: Combat) {
		this.actorId = actorId;
		this.combat = combat;
		this.moveId = moveId;
		this.targetId = targetId;
		Object.freeze(this);
	}

	/**
	 * Creates an immutable resolved action.
	 *
	 * @param actorId - Acting combatant identifier.
	 * @param moveId - Resolved Move identifier.
	 * @param targetId - Target combatant identifier.
	 * @param combat - Successor snapshot produced by the action.
	 * @returns The resolved action.
	 */
	static create(actorId: string, moveId: string, targetId: string, combat: Combat): DuelmonCombatTurnAction {
		return new DuelmonCombatTurnAction(actorId, moveId, targetId, combat);
	}
}

export { DuelmonCombatTurnAction };

export default DuelmonCombatTurnAction;
