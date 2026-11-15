import Either from '@hexadrop/either';
import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import RandomPocket from '@pocket-forge/rng/domain';

import CombatTransitionError from './combat-transition.error';
import type { CombatantGroupPrimitives } from './combatant-group';
import CombatantGroup from './combatant-group';

type CombatStatus = 'active' | 'completed';

interface CombatPrimitives extends Omit<Primitives<Combat>, 'attributes' | 'groups' | 'randomPocket'> {
	readonly attributes: AttributeValues;
	readonly groups: CombatantGroupPrimitives[];
	readonly randomPocket: Primitives<RandomPocket>;
}

interface CombatTransitionData {
	readonly groups: readonly CombatantGroup[];
	readonly randomPocket: RandomPocket;
	readonly status: CombatStatus;
}

class Combat<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	readonly attributes: AttributeMap<T>;
	readonly groups: readonly CombatantGroup[];
	readonly id: string;
	readonly randomPocket: RandomPocket;
	readonly status: CombatStatus;

	private constructor(
		attributes: AttributeMap<T>,
		groups: readonly CombatantGroup[],
		id: string,
		randomPocket: RandomPocket,
		status: CombatStatus
	) {
		this.attributes = attributes;
		this.groups = groups;
		this.id = id;
		this.randomPocket = randomPocket;
		this.status = status;
	}

	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		groups: CombatantGroup[],
		values: T,
		definitions: AttributeDefinition[],
		randomPocket: RandomPocket
	): Combat<T> {
		if (!id) {
			throw new InvalidArgumentError('Combat id is required', 'Combat');
		}

		if (groups.length === 0) {
			throw new InvalidArgumentError('Combat requires at least one group', 'Combat');
		}

		const membershipErrors = this.collectMembershipErrors(groups);

		if (membershipErrors.length > 0) {
			throw new InvalidArgumentError(membershipErrors[0]?.message ?? 'Invalid combat membership', 'Combat');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'Combat');

		return new Combat(attributeMap, Object.freeze(groups.map(g => g)), id, randomPocket, 'active');
	}

	static fromPrimitives(primitives: CombatPrimitives): Combat {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);
		const groups = primitives.groups.map(g => CombatantGroup.fromPrimitives(g));

		return new Combat(
			attributeMap,
			Object.freeze(groups),
			primitives.id,
			RandomPocket.fromPrimitives(primitives.randomPocket),
			primitives.status
		);
	}

	/**
	 * Validates the membership invariants of a group composition.
	 *
	 * Group ids and combatant ids must be unique across the combat, and every
	 * combatant must belong to the group that contains it. Failures are
	 * aggregated instead of thrown so callers can report every violation.
	 *
	 * @param groups - Groups that compose a combat.
	 * @returns No value on success, or every membership violation.
	 */
	static validateComposition(groups: readonly CombatantGroup[]): Either<CombatTransitionError[], void> {
		const errors = this.collectMembershipErrors(groups);

		return errors.length > 0 ? Either.left(errors) : Either.right();
	}

	private static collectMembershipErrors(groups: readonly CombatantGroup[]): CombatTransitionError[] {
		const errors: CombatTransitionError[] = [];
		const groupIds = new Set<string>();
		const combatantIds = new Set<string>();

		for (const [groupIndex, group] of groups.entries()) {
			const groupPath = `groups.${String(groupIndex)}`;

			if (groupIds.has(group.id)) {
				errors.push(
					new CombatTransitionError('duplicate-group', `Duplicated group id: ${group.id}`, groupPath)
				);
			}
			groupIds.add(group.id);

			for (const [combatantIndex, combatant] of group.combatants.entries()) {
				const combatantPath = `${groupPath}.combatants.${String(combatantIndex)}`;

				if (combatantIds.has(combatant.id)) {
					errors.push(
						new CombatTransitionError(
							'duplicate-combatant',
							`Duplicated combatant id: ${combatant.id}`,
							combatantPath
						)
					);
				}
				combatantIds.add(combatant.id);

				if (combatant.groupId !== group.id) {
					errors.push(
						new CombatTransitionError(
							'invalid-membership',
							`Combatant ${combatant.id} groupId ${combatant.groupId} does not match group ${group.id}`,
							`${combatantPath}.groupId`
						)
					);
				}
			}
		}

		return errors;
	}

	/**
	 * Applies a transition to this combat.
	 *
	 * Domain rejections are returned as structured failures: completed combat
	 * never reopens, membership must stay consistent, and a rejected transition
	 * leaves this snapshot unchanged.
	 *
	 * @param transition - Successor groups, randomness, and lifecycle status.
	 * @returns The successor snapshot, or every rejection.
	 */
	apply(transition: CombatTransitionData): Either<CombatTransitionError[], Combat> {
		if (this.status === 'completed') {
			return Either.left([
				new CombatTransitionError('completed-combat', 'Cannot apply transition to completed combat', 'status'),
			]);
		}

		const composition = Combat.validateComposition(transition.groups);

		if (composition.isLeft()) {
			return Either.left(composition.getLeft());
		}

		const successor = new Combat(
			this.attributes,
			Object.freeze(transition.groups.map(g => g)),
			this.id,
			transition.randomPocket,
			transition.status
		);

		return Either.right(successor);
	}

	toPrimitives(): CombatPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			groups: this.groups.map(g => g.toPrimitives()),
			id: this.id,
			randomPocket: this.randomPocket.toPrimitives(),
			status: this.status,
		};
	}
}

export type { CombatPrimitives, CombatStatus, CombatTransitionData };

export default Combat;
