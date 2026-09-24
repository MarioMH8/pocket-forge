import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import type { CombatantPrimitives } from './combatant';
import Combatant from './combatant';

export interface CombatantGroupPrimitives extends Omit<Primitives<CombatantGroup>, 'attributes' | 'combatants'> {
	readonly attributes: AttributeValues;
	readonly combatants: CombatantPrimitives[];
}

export default class CombatantGroup<T extends Record<keyof T, AttributeValue> = AttributeValues> {
	readonly attributes: AttributeMap<T>;
	readonly combatants: readonly Combatant[];
	readonly id: string;
	readonly name: string;

	private constructor(attributes: AttributeMap<T>, combatants: readonly Combatant[], id: string, name: string) {
		this.attributes = attributes;
		this.combatants = combatants;
		this.id = id;
		this.name = name;
	}

	static create<T extends Record<keyof T, AttributeValue>>(
		id: string,
		name: string,
		combatants: Combatant[],
		values: T,
		definitions: AttributeDefinition[]
	): CombatantGroup<T> {
		if (!id) {
			throw new InvalidArgumentError('CombatantGroup id is required', 'CombatantGroup');
		}
		if (!name) {
			throw new InvalidArgumentError('CombatantGroup name is required', 'CombatantGroup');
		}

		if (combatants.length === 0) {
			throw new InvalidArgumentError('CombatantGroup requires at least one combatant', 'CombatantGroup');
		}

		const attributeMap = AttributeMap.create(values, definitions, 'CombatantGroup');

		return new CombatantGroup(attributeMap, Object.freeze([...combatants]), id, name);
	}

	static fromPrimitives(primitives: CombatantGroupPrimitives): CombatantGroup {
		const attributeMap = AttributeMap.fromPrimitives(primitives.attributes);
		const combatants = primitives.combatants.map(c => Combatant.fromPrimitives(c));

		return new CombatantGroup(attributeMap, Object.freeze(combatants), primitives.id, primitives.name);
	}

	toPrimitives(): CombatantGroupPrimitives {
		return {
			attributes: this.attributes.toPrimitives(),
			combatants: this.combatants.map(c => c.toPrimitives()),
			id: this.id,
			name: this.name,
		};
	}
}
