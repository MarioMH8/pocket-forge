import Either from '@hexadrop/either';
import type { Combat, Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';

import { DuelmonCombat } from '../combat/duelmon-combat';
import { DuelmonMove } from '../move/duelmon-move';
import type { DuelmonCombatInput, ResolvedDuelmonTarget } from '../support';
import { DuelmonFailure, DuelmonTarget } from '../support';

/**
 * One declared turn action, validated against the combat.
 *
 * The declaration is input, not state: it is never stored in `Combat` and has
 * no pending or confirmed variant. The value owns the resolved actor, Move,
 * target, and target write path, so the action does not repeat the validation.
 */
class DuelmonTurnDeclaration {
	/**
	 * Combatant declaring the action.
	 */
	readonly actor: Combatant;
	/**
	 * Move known by the actor's creature.
	 */
	readonly move: DuelmonMove;
	/**
	 * Stable identifier of the declared Move.
	 */
	readonly moveId: string;
	/**
	 * Resolved target and its write path.
	 */
	readonly resolvedTarget: ResolvedDuelmonTarget;
	/**
	 * Active opposing combatant receiving the action.
	 */
	readonly target: Combatant;

	private constructor(
		actor: Combatant,
		move: DuelmonMove,
		moveId: string,
		resolvedTarget: ResolvedDuelmonTarget,
		target: Combatant
	) {
		this.actor = actor;
		this.move = move;
		this.moveId = moveId;
		this.resolvedTarget = resolvedTarget;
		this.target = target;
	}

	/**
	 * Validates a parsed declaration against the combat state.
	 *
	 * The target must use the `combatant` scope. The actor must exist and be
	 * active in its group, the Move must exist in the catalog and belong to the
	 * actor's creature, and the target must be an active combatant of the
	 * opposing group.
	 *
	 * @param catalog - Duelmon catalog.
	 * @param combat - Current combat snapshot.
	 * @param input - Parsed Duelmon input.
	 * @returns The validated declaration, or the first structured failure.
	 * @throws {InvalidArgumentError} When a group lacks a valid active combatant subset.
	 * @example
	 * ```ts
	 * const declaration = DuelmonTurnDeclaration.validate(catalog, combat, input);
	 * ```
	 */
	static validate(
		catalog: DuelmonCatalog,
		combat: Combat,
		input: DuelmonCombatInput
	): Either<CombatResolutionError[], DuelmonTurnDeclaration> {
		const resolvedTarget = input.target.resolve(combat, 'combatant');

		if (resolvedTarget.isLeft()) {
			return Either.left(resolvedTarget.getLeft());
		}

		const targetResolution = resolvedTarget.getRight();
		const target = targetResolution.combatant;

		if (!target) {
			return DuelmonFailure.fail(
				'invalid-target',
				'Target scope "combatant" requires a combatant id',
				'input.target.id'
			);
		}

		const actor = DuelmonTarget.findCombatant(combat, input.actorId);

		if (!actor) {
			return DuelmonFailure.fail('invalid-input', `Unknown combatant actor "${input.actorId}"`, 'input.actorId');
		}

		const combatView = DuelmonCombat.fromCombat(combat);
		const actorGroup = combatView.group(actor.groupId);

		if (!actorGroup?.activeCombatantIds.includes(actor.id)) {
			return DuelmonFailure.fail(
				'rejected',
				`Combatant "${actor.id}" is not active in its group`,
				'input.actorId'
			);
		}

		const catalogMove = catalog.findMove(input.moveId);

		if (!catalogMove) {
			return DuelmonFailure.fail(
				'invalid-input',
				`Unknown Move "${input.moveId}" in the Duelmon catalog`,
				'input.moveId'
			);
		}

		if (actor.creature.moves.every(creatureMove => creatureMove.id !== input.moveId)) {
			return DuelmonFailure.fail(
				'rejected',
				`Combatant "${actor.id}" does not know Move "${input.moveId}"`,
				'input.moveId'
			);
		}

		if (target.groupId === actorGroup.id) {
			return DuelmonFailure.fail(
				'invalid-target',
				`Target "${target.id}" belongs to the actor's group`,
				'input.target.id'
			);
		}

		const targetGroup = combatView.group(target.groupId);

		if (!targetGroup?.activeCombatantIds.includes(target.id)) {
			return DuelmonFailure.fail(
				'invalid-target',
				`Target "${target.id}" is not an active combatant of the opposing group`,
				'input.target.id'
			);
		}

		return Either.right(
			new DuelmonTurnDeclaration(actor, DuelmonMove.fromMove(catalogMove), input.moveId, targetResolution, target)
		);
	}
}

export { DuelmonTurnDeclaration };

export default DuelmonTurnDeclaration;
