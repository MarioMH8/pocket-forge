import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatantGroup } from '@pocket-forge/combat/domain';

import { DuelmonAttributeReader } from '../support/duelmon-attribute-reader';
import { DuelmonCombatant } from './duelmon-combatant';

/**
 * Semantic view of a neutral Combatant Group.
 *
 * The view assumes the combat start validated the group attributes. It exposes
 * the group's combatants and active subset, and never replaces the core
 * Combatant Group as the source of truth.
 */
class DuelmonCombatantGroup {
	/**
	 * Stable group identifier.
	 */
	readonly id: string;
	private cachedActiveCombatantIds: readonly string[] | undefined;
	private cachedCombatants: readonly DuelmonCombatant[] | undefined;
	private readonly group: CombatantGroup;
	private readonly values: AttributeValues;

	private constructor(group: CombatantGroup) {
		this.id = group.id;
		this.group = group;
		this.values = group.attributes.toPrimitives();
	}

	/**
	 * Identifiers of the active subset of the group.
	 *
	 * @throws {InvalidArgumentError} When the active subset is missing or invalid.
	 */
	get activeCombatantIds(): readonly string[] {
		this.cachedActiveCombatantIds ??= DuelmonAttributeReader.stringArray(
			this.values,
			'activeCombatantIds',
			`DuelmonCombatantGroup "${this.id}"`
		);

		return this.cachedActiveCombatantIds;
	}

	/**
	 * Builds a view from a neutral Combatant Group.
	 *
	 * @param group - Combatant Group already validated by the combat start.
	 * @returns The semantic view.
	 */
	static fromGroup(group: CombatantGroup): DuelmonCombatantGroup {
		return new DuelmonCombatantGroup(group);
	}

	/**
	 * Combatants in the active subset, in group order.
	 *
	 * @returns The active combatant views.
	 */
	activeCombatants(): readonly DuelmonCombatant[] {
		const activeIds = new Set(this.activeCombatantIds);

		return this.combatants().filter(combatant => activeIds.has(combatant.id));
	}

	/**
	 * Finds a combatant by its identifier.
	 *
	 * @param id - Combatant identifier.
	 * @returns The matching combatant, or `undefined` when it is unknown.
	 */
	combatant(id: string): DuelmonCombatant | undefined {
		return this.combatants().find(combatant => combatant.id === id);
	}

	/**
	 * Every combatant of the group, in group order.
	 *
	 * @returns The combatant views.
	 */
	combatants(): readonly DuelmonCombatant[] {
		this.cachedCombatants ??= Object.freeze(
			this.group.combatants.map(combatant => DuelmonCombatant.fromCombatant(combatant))
		);

		return this.cachedCombatants;
	}
}

export { DuelmonCombatantGroup };

export default DuelmonCombatantGroup;
