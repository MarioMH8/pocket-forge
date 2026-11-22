import type { AttributeValues } from '@pocket-forge/attribute/domain';

/**
 * Content reference for one combatant in a start request.
 *
 * It only names content: species, loadout moves, and the stable creature and
 * combatant identifiers. Battle attributes are derived by the start contract.
 */
interface DuelmonCombatStartCombatantRequest {
	/**
	 * Stable creature instance identifier.
	 */
	readonly creatureId: string;
	/**
	 * Stable combatant identifier.
	 */
	readonly id: string;
	/**
	 * Loadout move identifiers resolved through the catalog.
	 */
	readonly moveIds: readonly string[];
	/**
	 * Catalog species identifier.
	 */
	readonly speciesId: string;
}

/**
 * One side of a start request.
 */
interface DuelmonCombatStartGroupRequest {
	/**
	 * Active subset of the group. Phase 1 requires exactly one.
	 */
	readonly activeCombatantIds: readonly string[];
	/**
	 * Participants on this side.
	 */
	readonly combatants: readonly DuelmonCombatStartCombatantRequest[];
	/**
	 * Stable group identifier.
	 */
	readonly id: string;
}

/**
 * Authored starting point of a combat.
 *
 * The same request always produces the same initial combat: content is
 * resolved deterministically, the level is fixed by Phase 1, and the seed
 * initializes the only source of randomness.
 */
interface DuelmonCombatStartRequest {
	/**
	 * Combat-level battle attributes. Phase 1 starts with `{}`.
	 */
	readonly attributes?: AttributeValues;
	/**
	 * Combatant groups in order. Index `0` is the player side.
	 */
	readonly groups: readonly DuelmonCombatStartGroupRequest[];
	/**
	 * Stable combat identifier.
	 */
	readonly id: string;
	/**
	 * RandomPocket seed.
	 */
	readonly seed: number;
}

export type { DuelmonCombatStartCombatantRequest, DuelmonCombatStartGroupRequest, DuelmonCombatStartRequest };
