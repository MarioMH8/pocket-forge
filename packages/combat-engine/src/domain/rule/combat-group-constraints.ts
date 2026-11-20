/**
 * Generic composition constraints declared by a Combat Composition Rule.
 *
 * Constraints describe how many Combatant Groups a format requires and how
 * many Combatants each group may hold. They never reference Moves, actions, or
 * victory conditions.
 */
export default interface CombatGroupConstraints {
	/**
	 * Maximum number of Combatants allowed in a single group.
	 */
	readonly maxCombatantsPerGroup: number;
	/**
	 * Maximum number of groups allowed in a combat.
	 */
	readonly maxGroups: number;
	/**
	 * Minimum number of Combatants required in a single group.
	 */
	readonly minCombatantsPerGroup: number;
	/**
	 * Minimum number of groups required in a combat.
	 */
	readonly minGroups: number;
}
