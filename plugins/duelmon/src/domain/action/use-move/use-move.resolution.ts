import Either from '@hexadrop/either';
import type { Combat, Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonType } from '@pocket-forge/duelmon-dataset';

import { DuelmonMove } from '../../move/duelmon-move';
import { DuelmonSpecies } from '../../species/duelmon-species';
import type { DuelmonCombatInput, ResolvedDuelmonTarget } from '../../support';
import { DuelmonFailure, DuelmonTarget } from '../../support';
import type { UseMoveAttributes } from './use-move.mechanics';

/**
 * Resolved inputs of one damaging `useMove` resolution.
 *
 * The value object owns move, species, combatant, type, multiplier, and
 * power/accuracy resolution. The action only coordinates immunity, mechanics,
 * randomness, HP, and events.
 */
class UseMoveResolution {
	/**
	 * Combatant using the move.
	 */
	readonly attacker: Combatant;
	/**
	 * Types of the attacker's species.
	 */
	readonly attackerTypes: readonly DuelmonType[];
	/**
	 * Effective type multiplier across every defender type.
	 */
	readonly effectiveness: number;
	/**
	 * Move attributes required by the mechanics.
	 */
	readonly move: UseMoveAttributes;
	/**
	 * Stable move identifier from the input.
	 */
	readonly moveId: string;
	/**
	 * Resolved combatant target and its write path.
	 */
	readonly resolvedTarget: ResolvedDuelmonTarget;
	/**
	 * Combatant receiving the move.
	 */
	readonly target: Combatant;
	/**
	 * One type multiplier per defending type, in order.
	 */
	readonly typeMultipliers: readonly number[];

	private constructor(
		attacker: Combatant,
		attackerTypes: readonly DuelmonType[],
		move: UseMoveAttributes,
		moveId: string,
		resolvedTarget: ResolvedDuelmonTarget,
		target: Combatant,
		typeMultipliers: readonly number[]
	) {
		this.attacker = attacker;
		this.attackerTypes = attackerTypes;
		this.move = move;
		this.moveId = moveId;
		this.resolvedTarget = resolvedTarget;
		this.target = target;
		this.typeMultipliers = typeMultipliers;
		this.effectiveness = typeMultipliers.reduce((product, multiplier) => product * multiplier, 1);
	}

	/**
	 * Resolves the move, both combatants, species, types, and multipliers.
	 *
	 * @param catalog - Duelmon catalog.
	 * @param combat - Current combat snapshot.
	 * @param input - Parsed Duelmon input.
	 * @param resolvedTarget - Target already resolved to the `combatant` scope.
	 * @returns The resolved inputs, or every resolution failure.
	 */
	static create(
		catalog: DuelmonCatalog,
		combat: Combat,
		input: DuelmonCombatInput,
		resolvedTarget: ResolvedDuelmonTarget
	): Either<CombatResolutionError[], UseMoveResolution> {
		const target = resolvedTarget.combatant;

		if (!target) {
			return DuelmonFailure.fail(
				'invalid-target',
				'Target scope "combatant" requires a combatant id',
				'input.target.id'
			);
		}

		const attacker = DuelmonTarget.findCombatant(combat, input.actorId);

		if (!attacker) {
			return DuelmonFailure.fail('invalid-input', `Unknown combatant actor "${input.actorId}"`, 'input.actorId');
		}

		const move = catalog.findMove(input.moveId);

		if (!move) {
			return DuelmonFailure.fail(
				'invalid-input',
				`Unknown Move "${input.moveId}" in the Duelmon catalog`,
				'input.moveId'
			);
		}

		const moveView = DuelmonMove.fromMove(move);

		if (!moveView.isDamaging) {
			return DuelmonFailure.fail(
				'rejected',
				`Move "${input.moveId}" does not have a damaging category`,
				'input.moveId'
			);
		}

		const attackerSpecies = catalog.findSpecies(attacker.creature.species.id);

		if (!attackerSpecies) {
			return DuelmonFailure.fail(
				'invalid-input',
				`Unknown species "${attacker.creature.species.id}" for attacker "${attacker.id}"`,
				`combatants.${attacker.id}.creature.species.id`
			);
		}

		const targetSpecies = catalog.findSpecies(target.creature.species.id);

		if (!targetSpecies) {
			return DuelmonFailure.fail(
				'invalid-target',
				`Unknown species "${target.creature.species.id}" for target "${target.id}"`,
				`combatants.${target.id}.creature.species.id`
			);
		}

		const attackerTypes = DuelmonSpecies.fromSpecies(attackerSpecies).types;
		const targetTypes = DuelmonSpecies.fromSpecies(targetSpecies).types;

		return Either.right(
			new UseMoveResolution(
				attacker,
				attackerTypes,
				{
					accuracy: moveView.accuracy,
					alwaysHits: moveView.alwaysHits,
					category: moveView.category,
					power: moveView.power,
					type: moveView.type,
				},
				input.moveId,
				resolvedTarget,
				target,
				catalog.typeMultipliers(moveView.type, targetTypes)
			)
		);
	}
}

export { UseMoveResolution };

export default UseMoveResolution;
