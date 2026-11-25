import type { Combat } from '@pocket-forge/combat/domain';

import type { DuelmonCombatHistoryEntryPrimitives } from './duelmon-combat-history-entry';
import { DuelmonCombatHistoryEntry } from './duelmon-combat-history-entry';

/**
 * Serializable form of the basic Duelmon combat history.
 */
interface DuelmonCombatHistoryPrimitives {
	/**
	 * Entries in the order they were recorded.
	 */
	readonly entries: readonly DuelmonCombatHistoryEntryPrimitives[];
}

/**
 * Ordered, serializable record of what happened in a Duelmon combat.
 *
 * The history keeps the canonical snapshot of each recorded moment; the
 * `Combat` remains the source of truth for the current state.
 */
class DuelmonCombatHistory {
	private readonly list: readonly DuelmonCombatHistoryEntry[];

	private constructor(entries: readonly DuelmonCombatHistoryEntry[]) {
		this.list = Object.freeze([...entries]);
	}

	/**
	 * Hydrates a history from persisted primitives.
	 *
	 * @param primitives - History primitives already validated at write time.
	 * @returns The hydrated history.
	 */
	static fromPrimitives(primitives: DuelmonCombatHistoryPrimitives): DuelmonCombatHistory {
		return new DuelmonCombatHistory(
			primitives.entries.map(entry => DuelmonCombatHistoryEntry.fromPrimitives(entry))
		);
	}

	/**
	 * Starts the history with the combat start entry.
	 *
	 * @param combat - Combat returned by the combat start.
	 * @returns The history with one start entry.
	 */
	static start(combat: Combat): DuelmonCombatHistory {
		return new DuelmonCombatHistory([DuelmonCombatHistoryEntry.start(combat)]);
	}

	/**
	 * Entries in the order they were recorded.
	 *
	 * @returns The history entries.
	 */
	entries(): readonly DuelmonCombatHistoryEntry[] {
		return this.list;
	}

	/**
	 * Serializable form of the history.
	 *
	 * @returns The history primitives.
	 */
	toPrimitives(): DuelmonCombatHistoryPrimitives {
		return { entries: this.list.map(entry => entry.toPrimitives()) };
	}
}

export type { DuelmonCombatHistoryPrimitives };
export { DuelmonCombatHistory };

export default DuelmonCombatHistory;
