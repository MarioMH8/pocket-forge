import type { Combat } from '@pocket-forge/combat/domain';

/**
 * Whether the fixed combat order decided an equal-Speed tie.
 */
type DuelmonTieBreak = boolean;

/**
 * One action the turn actually resolved.
 *
 * The action carries the declared actor, Move, and target identifiers together
 * with the successor `Combat` snapshot produced while resolving it. It also
 * carries the order information a reader needs to explain why the action ran
 * when it did: the actor Speed read from the state used to order the turn, and
 * whether the fixed combat order decided an equal-Speed tie.
 *
 * The turn result exposes these actions in the order they ran, so callers never
 * have to infer the order from the merged events.
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
	 * Actor Speed read from the state used to order the turn.
	 */
	readonly speed: number;
	/**
	 * Target combatant identifier.
	 */
	readonly targetId: string;
	/**
	 * Whether the fixed combat order decided an equal-Speed tie.
	 */

	readonly tieBreak: boolean;

	private constructor(
		actorId: string,
		moveId: string,
		targetId: string,
		combat: Combat,
		speed: number,
		// eslint-disable-next-line unicorn/consistent-boolean-name -- the public contract names this value `tieBreak`
		tieBreakFlag: DuelmonTieBreak
	) {
		this.actorId = actorId;
		this.combat = combat;
		this.moveId = moveId;
		this.speed = speed;
		this.targetId = targetId;
		this.tieBreak = tieBreakFlag;
		Object.freeze(this);
	}

	/**
	 * Creates an immutable resolved action.
	 *
	 * @param actorId - Acting combatant identifier.
	 * @param moveId - Resolved Move identifier.
	 * @param targetId - Target combatant identifier.
	 * @param combat - Successor snapshot produced by the action.
	 * @param speed - Actor Speed read from the state used to order the turn.
	 * @param tieBreak - Whether the fixed combat order decided an equal-Speed tie.
	 * @returns The resolved action.
	 */
	static create(
		actorId: string,
		moveId: string,
		targetId: string,
		combat: Combat,
		speed: number,
		// eslint-disable-next-line unicorn/consistent-boolean-name -- the public contract names this value `tieBreak`
		tieBreak: DuelmonTieBreak
	): DuelmonCombatTurnAction {
		return new DuelmonCombatTurnAction(actorId, moveId, targetId, combat, speed, tieBreak);
	}
}

export { DuelmonCombatTurnAction };

export default DuelmonCombatTurnAction;
