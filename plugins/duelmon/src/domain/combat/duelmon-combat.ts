import type { Combat } from '@pocket-forge/combat/domain';

import { DuelmonCombatantGroup } from './duelmon-combatant-group';

/**
 * Semantic view of a neutral Combat.
 *
 * The view exposes the combat groups and their active subset in order, and
 * never replaces the core Combat as the source of truth.
 */
class DuelmonCombat {
	/**
	 * Stable combat identifier.
	 */
	readonly id: string;
	private cachedGroups: readonly DuelmonCombatantGroup[] | undefined;
	private readonly combat: Combat;

	private constructor(combat: Combat) {
		this.id = combat.id;
		this.combat = combat;
	}

	/**
	 * Builds a view from a neutral Combat.
	 *
	 * @param combat - Combat already validated by the combat start.
	 * @returns The semantic view.
	 */
	static fromCombat(combat: Combat): DuelmonCombat {
		return new DuelmonCombat(combat);
	}

	/**
	 * Finds a group by its identifier.
	 *
	 * @param id - Group identifier.
	 * @returns The matching group, or `undefined` when it is unknown.
	 */
	group(id: string): DuelmonCombatantGroup | undefined {
		return this.groups().find(group => group.id === id);
	}

	/**
	 * Every group of the combat, in combat order.
	 *
	 * @returns The group views.
	 */
	groups(): readonly DuelmonCombatantGroup[] {
		this.cachedGroups ??= Object.freeze(this.combat.groups.map(group => DuelmonCombatantGroup.fromGroup(group)));

		return this.cachedGroups;
	}
}

export { DuelmonCombat };

export default DuelmonCombat;
