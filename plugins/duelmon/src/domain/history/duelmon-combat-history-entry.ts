import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';

import { DuelmonCombatReport } from '../report/duelmon-combat-report';

/**
 * Event recorded by a Duelmon Combat History Entry.
 *
 * Phase 1 only records the combat start; later entries extend this union.
 */
type DuelmonCombatHistoryEntryKind = 'start';

/**
 * Serializable form of a Duelmon Combat History Entry.
 */
interface DuelmonCombatHistoryEntryPrimitives {
	/**
	 * Canonical `Combat.toPrimitives()` snapshot of the recorded moment.
	 */
	readonly combat: CombatPrimitives;
	/**
	 * Event the entry records.
	 */
	readonly kind: DuelmonCombatHistoryEntryKind;
	/**
	 * Readable text of the recorded moment.
	 */
	readonly text: string;
}

/**
 * One immutable item of the basic combat history.
 *
 * The entry keeps the canonical `Combat.toPrimitives()` snapshot and the
 * readable report text, both built from the same `Combat` used by battle
 * resolution. It never keeps a manual copy of the state.
 */
class DuelmonCombatHistoryEntry {
	/**
	 * Event the entry records.
	 */
	readonly kind: DuelmonCombatHistoryEntryKind;
	/**
	 * Readable text of the recorded moment.
	 */
	readonly text: string;
	private readonly snapshot: CombatPrimitives;

	private constructor(primitives: DuelmonCombatHistoryEntryPrimitives) {
		this.kind = primitives.kind;
		this.text = primitives.text;
		this.snapshot = structuredClone(primitives.combat);
	}

	/**
	 * Canonical combat snapshot of the recorded moment.
	 *
	 * @returns A detached copy of the `Combat.toPrimitives()` snapshot.
	 */
	get combat(): CombatPrimitives {
		return structuredClone(this.snapshot);
	}

	/**
	 * Hydrates an entry from persisted primitives.
	 *
	 * @param primitives - Entry primitives already validated at write time.
	 * @returns The hydrated entry.
	 */
	static fromPrimitives(primitives: DuelmonCombatHistoryEntryPrimitives): DuelmonCombatHistoryEntry {
		return new DuelmonCombatHistoryEntry(primitives);
	}

	/**
	 * Records the start of a combat.
	 *
	 * @param combat - Combat returned by the combat start.
	 * @returns The start entry.
	 */
	static start(combat: Combat): DuelmonCombatHistoryEntry {
		return new DuelmonCombatHistoryEntry({
			combat: combat.toPrimitives(),
			kind: 'start',
			text: DuelmonCombatReport.fromCombat(combat).toString(),
		});
	}

	/**
	 * Serializable form of the entry.
	 *
	 * @returns The entry primitives.
	 */
	toPrimitives(): DuelmonCombatHistoryEntryPrimitives {
		return {
			combat: this.combat,
			kind: this.kind,
			text: this.text,
		};
	}
}

export type { DuelmonCombatHistoryEntryKind, DuelmonCombatHistoryEntryPrimitives };
export { DuelmonCombatHistoryEntry };

export default DuelmonCombatHistoryEntry;
