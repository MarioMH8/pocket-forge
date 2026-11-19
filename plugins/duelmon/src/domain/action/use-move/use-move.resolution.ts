import Either from '@hexadrop/either';
import type { Combat, Combatant } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { Move } from '@pocket-forge/move/domain';
import type { Species } from '@pocket-forge/species/domain';

import type { DuelmonType } from '../../../duelmon.types';
import { DuelmonTypes } from '../../../duelmon.types';
import { DuelmonErrors } from '../duelmon.errors';
import type { DuelmonCombatInput } from '../duelmon-combat.input';
import type { ResolvedDuelmonTarget } from '../duelmon-target';
import { DuelmonTarget } from '../duelmon-target';
import type { UseMoveAttributes } from './use-move.mechanics';

const STATUS_CATEGORY = 'Status';

function readMoveAttributes(move: Move, moveId: string): Either<CombatResolutionError[], UseMoveAttributes> {
	const values = move.attributes.toPrimitives();
	const type = values['type'];
	const category = values['category'];
	const power = values['power'];
	const accuracy = values['accuracy'];
	const alwaysHits = values['alwaysHits'];

	if (
		typeof power !== 'number' ||
		typeof accuracy !== 'number' ||
		typeof alwaysHits !== 'boolean' ||
		!DuelmonTypes.is(type) ||
		!DuelmonTypes.isCategory(category)
	) {
		return DuelmonErrors.fail('invalid-action', `Move "${moveId}" has invalid catalog attributes`, 'input.moveId');
	}

	return Either.right({ accuracy, alwaysHits, category, power, type });
}

function readSpeciesTypes(
	species: Species,
	reason: 'invalid-input' | 'invalid-target',
	path: string
): Either<CombatResolutionError[], readonly DuelmonType[]> {
	const types = species.attributes.toPrimitives()['types'];

	if (!Array.isArray(types)) {
		return DuelmonErrors.fail(reason, `Species "${species.id}" has invalid types`, path);
	}

	const parsed: DuelmonType[] = [];

	for (const type of types) {
		if (!DuelmonTypes.is(type)) {
			return DuelmonErrors.fail(reason, `Species "${species.id}" has invalid types`, path);
		}

		parsed.push(type);
	}

	return Either.right(parsed);
}

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
			return DuelmonErrors.fail(
				'invalid-target',
				'Target scope "combatant" requires a combatant id',
				'input.target.id'
			);
		}

		const attacker = DuelmonTarget.findCombatant(combat, input.actorId);

		if (!attacker) {
			return DuelmonErrors.fail('invalid-input', `Unknown combatant actor "${input.actorId}"`, 'input.actorId');
		}

		const move = catalog.findMove(input.moveId);

		if (!move) {
			return DuelmonErrors.fail(
				'invalid-input',
				`Unknown Move "${input.moveId}" in the Duelmon catalog`,
				'input.moveId'
			);
		}

		const moveAttributes = readMoveAttributes(move, input.moveId);

		if (moveAttributes.isLeft()) {
			return Either.left(moveAttributes.getLeft());
		}

		const attributes = moveAttributes.getRight();

		if (attributes.category === STATUS_CATEGORY) {
			return DuelmonErrors.fail(
				'rejected',
				`Move "${input.moveId}" does not have a damaging category`,
				'input.moveId'
			);
		}

		const attackerSpecies = catalog.findSpecies(attacker.creature.species.id);

		if (!attackerSpecies) {
			return DuelmonErrors.fail(
				'invalid-input',
				`Unknown species "${attacker.creature.species.id}" for attacker "${attacker.id}"`,
				`combatants.${attacker.id}.creature.species.id`
			);
		}

		const targetSpecies = catalog.findSpecies(target.creature.species.id);

		if (!targetSpecies) {
			return DuelmonErrors.fail(
				'invalid-target',
				`Unknown species "${target.creature.species.id}" for target "${target.id}"`,
				`combatants.${target.id}.creature.species.id`
			);
		}

		const attackerTypes = readSpeciesTypes(
			attackerSpecies,
			'invalid-input',
			`combatants.${attacker.id}.creature.species.attributes.types`
		);

		if (attackerTypes.isLeft()) {
			return Either.left(attackerTypes.getLeft());
		}

		const targetTypes = readSpeciesTypes(
			targetSpecies,
			'invalid-target',
			`combatants.${target.id}.creature.species.attributes.types`
		);

		if (targetTypes.isLeft()) {
			return Either.left(targetTypes.getLeft());
		}

		const defenderTypes = targetTypes.getRight();

		return Either.right(
			new UseMoveResolution(
				attacker,
				attackerTypes.getRight(),
				attributes,
				input.moveId,
				resolvedTarget,
				target,
				catalog.typeMultipliers(attributes.type, defenderTypes)
			)
		);
	}
}

export { UseMoveResolution };

export default UseMoveResolution;
