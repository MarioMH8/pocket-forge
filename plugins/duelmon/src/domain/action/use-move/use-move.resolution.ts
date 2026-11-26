import Either from '@hexadrop/either';
import type { Combat, Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonType } from '@pocket-forge/duelmon-dataset';

import { DuelmonCombat } from '../../combat/duelmon-combat';
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
	 * Validates the declaration against the combat and resolves the move, both
	 * combatants, species, types, and multipliers.
	 *
	 * The actor must exist and be active in its group, the Move must exist in
	 * the catalog and belong to the actor's creature, and the target must be an
	 * active combatant of the opposing group.
	 *
	 * @param catalog - Duelmon catalog.
	 * @param combat - Current combat snapshot.
	 * @param input - Parsed Duelmon input.
	 * @param resolvedTarget - Target already resolved to the `combatant` scope.
	 * @returns The resolved inputs, or every resolution failure.
	 * @throws {InvalidArgumentError} When a group lacks a valid active combatant subset.
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

		const combatView = DuelmonCombat.fromCombat(combat);
		const attackerGroup = combatView.group(attacker.groupId);

		if (!attackerGroup?.activeCombatantIds.includes(attacker.id)) {
			return DuelmonFailure.fail(
				'rejected',
				`Combatant "${attacker.id}" is not active in its group`,
				'input.actorId'
			);
		}

		if (target.groupId === attacker.groupId) {
			return DuelmonFailure.fail(
				'invalid-target',
				`Target "${target.id}" belongs to the attacker's group`,
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

		const catalogMove = catalog.findMove(input.moveId);

		if (!catalogMove) {
			return DuelmonFailure.fail(
				'invalid-input',
				`Unknown Move "${input.moveId}" in the Duelmon catalog`,
				'input.moveId'
			);
		}

		if (attacker.creature.moves.every(creatureMove => creatureMove.id !== input.moveId)) {
			return DuelmonFailure.fail(
				'rejected',
				`Combatant "${attacker.id}" does not know Move "${input.moveId}"`,
				'input.moveId'
			);
		}

		const move = DuelmonMove.fromMove(catalogMove);

		if (!move.isDamaging) {
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
					accuracy: move.accuracy,
					alwaysHits: move.alwaysHits,
					category: move.category,
					power: move.power,
					type: move.type,
				},
				input.moveId,
				resolvedTarget,
				target,
				catalog.typeMultipliers(move.type, targetTypes)
			)
		);
	}
}

export { UseMoveResolution };

export default UseMoveResolution;
