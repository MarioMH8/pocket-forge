import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type {
	CombatActionBinding,
	CombatActionContext,
	CombatActionDescriptor,
	CombatResolutionError,
} from '@pocket-forge/combat-engine/domain';
import { CombatTransition } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type RandomPocket from '@pocket-forge/rng/domain';

import { DuelmonCombatant } from '../../combat/duelmon-combatant';
import { DuelmonCombatEvents } from '../../event';
import type { DuelmonCombatInput } from '../../support';
import { DuelmonCombatAttributes, DuelmonFailure } from '../../support';
import { DuelmonTurnDeclaration } from '../../turn/duelmon-turn-declaration';
import type DuelmonAction from '../duelmon-action';
import type { UseMoveMechanics } from './use-move.mechanics';
import { UseMoveResolution } from './use-move.resolution';

const HP_KEY = 'hp';

/**
 * Resolves the generation-agnostic `useMove` action.
 *
 * The action owns target resolution, immunity ordering, the mechanics draw,
 * events, and the target HP update. Generation-specific stats, accuracy,
 * damage, and damage randomness live behind {@link UseMoveMechanics};
 * move, species, type, and multiplier lookups live in
 * {@link UseMoveResolution}.
 */
class UseMoveAction implements DuelmonAction {
	/**
	 * Stable identifier of the move-resolution action.
	 */
	static readonly ID = 'useMove';

	readonly descriptor: CombatActionDescriptor;
	readonly id: string;
	private readonly attributeDefinitions: readonly AttributeDefinition[];
	private readonly catalog: DuelmonCatalog;
	private readonly mechanics: UseMoveMechanics;

	constructor(
		catalog: DuelmonCatalog,
		mechanics: UseMoveMechanics,
		attributeDefinitions: readonly AttributeDefinition[]
	) {
		this.catalog = catalog;
		this.mechanics = mechanics;
		this.attributeDefinitions = attributeDefinitions;
		this.id = UseMoveAction.ID;
		this.descriptor = {
			configDefinitions: [],
			id: this.id,
		};
	}

	/**
	 * Rehydrates a combat with the advanced random state.
	 *
	 * @param combat - Current combat snapshot.
	 * @param randomPocket - Advanced random state.
	 * @returns The combat with the new random state.
	 */
	private static combatAfter(combat: Combat, randomPocket: RandomPocket): Combat {
		return CombatEntity.fromPrimitives({
			...combat.toPrimitives(),
			randomPocket: randomPocket.toPrimitives(),
		});
	}

	/**
	 * Resolves a single-target damaging move into a successor Combat.
	 *
	 * Validation happens before any randomness is consumed. The input Combat is
	 * never mutated: the successor is hydrated from changed primitives.
	 *
	 * @param context - Immutable action context.
	 * @param input - Parsed Duelmon input.
	 * @param _binding - Action binding that selected this action.
	 * @param declaration - Declaration already validated at the plugin boundary.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(
		context: CombatActionContext,
		input: DuelmonCombatInput,
		_binding: CombatActionBinding,
		declaration?: DuelmonTurnDeclaration
	): Either<CombatResolutionError[], CombatTransition> {
		let turnDeclaration = declaration;

		if (!turnDeclaration) {
			const validated = DuelmonTurnDeclaration.validate(this.catalog, context.combat, input);

			if (validated.isLeft()) {
				return Either.left(validated.getLeft());
			}

			turnDeclaration = validated.getRight();
		}

		if (!turnDeclaration.move.isDamaging) {
			return DuelmonFailure.fail(
				'rejected',
				`Move "${turnDeclaration.moveId}" does not have a damaging category`,
				'input.moveId'
			);
		}

		const resolution = UseMoveResolution.create(this.catalog, turnDeclaration);

		if (resolution.isLeft()) {
			return Either.left(resolution.getLeft());
		}

		const move = resolution.getRight();

		if (move.effectiveness === 0) {
			return Either.right(
				CombatTransition.create(context.combat, [
					DuelmonCombatEvents.moveUsed(
						{
							actionId: this.id,
							attackerId: move.attacker.id,
							damage: 0,
							effectiveness: 0,
							moveId: move.moveId,
							targetId: move.target.id,
						},
						1
					),
				])
			);
		}

		const hpDefinition = this.attributeDefinitions.find(entry => entry.key === HP_KEY);

		if (hpDefinition?.type !== 'number') {
			return DuelmonFailure.fail(
				'invalid-action',
				'The "useMove" action requires a numeric "hp" attribute definition',
				'attributeDefinitions'
			);
		}

		const currentHp = DuelmonCombatant.fromCombatant(move.target).hp;

		const outcome = this.mechanics.resolve(
			{
				attacker: move.attacker,
				attackerTypes: move.attackerTypes,
				move: move.move,
				target: move.target,
				typeMultipliers: move.typeMultipliers,
			},
			context.combat.randomPocket
		);

		if (outcome.isLeft()) {
			return Either.left(outcome.getLeft());
		}

		const result = outcome.getRight();

		if (!result.hit) {
			return Either.right(
				CombatTransition.create(UseMoveAction.combatAfter(context.combat, result.randomPocket), [
					DuelmonCombatEvents.moveMissed(
						{
							actionId: this.id,
							attackerId: move.attacker.id,
							moveId: move.moveId,
							targetId: move.target.id,
						},
						1
					),
				])
			);
		}

		const primitives = DuelmonCombatAttributes.update(
			context.combat.toPrimitives(),
			move.resolvedTarget,
			HP_KEY,
			DuelmonCombatAttributes.saturate(Math.max(0, currentHp - result.damage), hpDefinition)
		);

		const successor = CombatEntity.fromPrimitives({
			...primitives,
			randomPocket: result.randomPocket.toPrimitives(),
		});
		const event = DuelmonCombatEvents.moveUsed(
			{
				actionId: this.id,
				attackerId: move.attacker.id,
				damage: result.damage,
				effectiveness: move.effectiveness,
				moveId: move.moveId,
				targetId: move.target.id,
			},
			1
		);

		return Either.right(CombatTransition.create(successor, [event]));
	}
}

export { UseMoveAction };

export default UseMoveAction;
