import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import RandomPocket from '@pocket-forge/rng/domain';

import type { CombatantGroupPrimitives } from './combatant-group';
import CombatantGroup from './combatant-group';

type CombatStatus = 'active' | 'completed';

interface CombatPrimitives extends Omit<Primitives<Combat>, 'attributes' | 'groups' | 'randomPocket'> {
	readonly attributes: AttributeValues;
	readonly groups: CombatantGroupPrimitives[];
	readonly randomPocket: Primitives<RandomPocket>;
}

interface CombatTransition {
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

		const ids = new Set<string>();
		for (const group of groups) {
			for (const combatant of group.combatants) {
				if (ids.has(combatant.id)) {
					throw new InvalidArgumentError(`Duplicated combatant id: ${combatant.id}`, 'Combat');
				}
				ids.add(combatant.id);
			}
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

	apply(transition: CombatTransition): Combat {
		if (this.status === 'completed') {
			throw new InvalidArgumentError('Cannot apply transition to completed combat', 'Combat');
		}

		const ids = new Set<string>();
		for (const group of transition.groups) {
			for (const combatant of group.combatants) {
				if (ids.has(combatant.id)) {
					throw new InvalidArgumentError(`Duplicated combatant id in transition: ${combatant.id}`, 'Combat');
				}
				ids.add(combatant.id);
			}
		}

		return new Combat(
			this.attributes,
			Object.freeze(transition.groups.map(g => g)),
			this.id,
			transition.randomPocket,
			transition.status
		);
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

export type { CombatPrimitives, CombatStatus, CombatTransition };

export default Combat;
