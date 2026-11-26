import Either from '@hexadrop/either';
import type { Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonType } from '@pocket-forge/duelmon-dataset';

import { DuelmonSpecies } from '../../species/duelmon-species';
import type { ResolvedDuelmonTarget } from '../../support';
import { DuelmonFailure } from '../../support';
import type { DuelmonTurnDeclaration } from '../../turn/duelmon-turn-declaration';
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
	 * Resolves the species, types, and multipliers of a validated declaration.
	 *
	 * Declaration validity (actor activity, Move ownership, and target) is
	 * checked before this value is built.
	 *
	 * @param catalog - Duelmon catalog.
	 * @param declaration - Declaration already validated against the combat.
	 * @returns The resolved inputs, or every species failure.
	 */
	static create(
		catalog: DuelmonCatalog,
		declaration: DuelmonTurnDeclaration
	): Either<CombatResolutionError[], UseMoveResolution> {
		const { actor, move, moveId, resolvedTarget, target } = declaration;

		const attackerSpecies = catalog.findSpecies(actor.creature.species.id);

		if (!attackerSpecies) {
			return DuelmonFailure.fail(
				'invalid-input',
				`Unknown species "${actor.creature.species.id}" for attacker "${actor.id}"`,
				`combatants.${actor.id}.creature.species.id`
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
				actor,
				attackerTypes,
				{
					accuracy: move.accuracy,
					alwaysHits: move.alwaysHits,
					category: move.category,
					power: move.power,
					type: move.type,
				},
				moveId,
				resolvedTarget,
				target,
				catalog.typeMultipliers(move.type, targetTypes)
			)
		);
	}
}

export { UseMoveResolution };

export default UseMoveResolution;
