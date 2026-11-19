import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type {
	CombatActionContext,
	CombatActionDescriptor,
	CombatEvent,
	CombatMoveBinding,
	CombatResolutionError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type RandomPocket from '@pocket-forge/rng/domain';

import { DuelmonCombatAttributes } from '../combat-attributes';
import { DuelmonErrors } from '../duelmon.errors';
import type DuelmonAction from '../duelmon-action';
import type { DuelmonCombatInput } from '../duelmon-combat.input';
import type { UseMoveMechanics } from './use-move.mechanics';
import { UseMoveResolution } from './use-move.resolution';

const HP_KEY = 'hp';

function moveUsedEvent(
	actionId: string,
	attackerId: string,
	moveId: string,
	targetId: string,
	damage: number,
	effectiveness: number
): CombatEvent {
	return {
		payload: {
			actionId,
			attackerId,
			damage,
			effectiveness,
			moveId,
			targetId,
		},
		sequence: 1,
		type: 'move-used',
	};
}

function moveMissedEvent(actionId: string, attackerId: string, moveId: string, targetId: string): CombatEvent {
	return {
		payload: { actionId, attackerId, moveId, targetId },
		sequence: 1,
		type: 'move-missed',
	};
}

function combatAfter(combat: Combat, randomPocket: RandomPocket): Combat {
	return CombatEntity.fromPrimitives({
		...combat.toPrimitives(),
		randomPocket: randomPocket.toPrimitives(),
	});
}

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
	 * Resolves a single-target damaging move into a successor Combat.
	 *
	 * Validation happens before any randomness is consumed. The input Combat is
	 * never mutated: the successor is hydrated from changed primitives.
	 *
	 * @param context - Immutable action context.
	 * @param input - Parsed Duelmon input.
	 * @param _binding - Move binding that selected this action.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(
		context: CombatActionContext,
		input: DuelmonCombatInput,
		_binding: CombatMoveBinding
	): Either<CombatResolutionError[], CombatTransition> {
		const resolvedTarget = input.target.resolve(context.combat, 'combatant');

		if (resolvedTarget.isLeft()) {
			return Either.left(resolvedTarget.getLeft());
		}

		const resolution = UseMoveResolution.create(this.catalog, context.combat, input, resolvedTarget.getRight());

		if (resolution.isLeft()) {
			return Either.left(resolution.getLeft());
		}

		const move = resolution.getRight();

		if (move.effectiveness === 0) {
			return Either.right({
				combat: context.combat,
				events: [moveUsedEvent(this.id, move.attacker.id, move.moveId, move.target.id, 0, 0)],
			});
		}

		const hpDefinition = this.attributeDefinitions.find(entry => entry.key === HP_KEY);

		if (hpDefinition?.type !== 'number') {
			return DuelmonErrors.fail(
				'invalid-action',
				'The "useMove" action requires a numeric "hp" attribute definition',
				'attributeDefinitions'
			);
		}

		const currentHp = DuelmonCombatAttributes.readNumber(move.resolvedTarget.values, HP_KEY);

		if (currentHp === undefined) {
			return DuelmonErrors.fail(
				'invalid-target',
				`Combatant "${move.target.id}" is missing numeric "${HP_KEY}" attribute`,
				`combatants.${move.target.id}.${HP_KEY}`
			);
		}

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
			return Either.right({
				combat: combatAfter(context.combat, result.randomPocket),
				events: [moveMissedEvent(this.id, move.attacker.id, move.moveId, move.target.id)],
			});
		}

		const primitives = DuelmonCombatAttributes.update(
			context.combat.toPrimitives(),
			move.resolvedTarget,
			HP_KEY,
			DuelmonCombatAttributes.saturate(Math.max(0, currentHp - result.damage), hpDefinition)
		);

		return Either.right({
			combat: CombatEntity.fromPrimitives({
				...primitives,
				randomPocket: result.randomPocket.toPrimitives(),
			}),
			events: [
				moveUsedEvent(
					this.id,
					move.attacker.id,
					move.moveId,
					move.target.id,
					result.damage,
					move.effectiveness
				),
			],
		});
	}
}

export { UseMoveAction };

export default UseMoveAction;
