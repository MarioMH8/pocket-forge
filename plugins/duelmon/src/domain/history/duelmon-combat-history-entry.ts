import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';

import { DuelmonCombatReport } from '../report/duelmon-combat-report';

/**
 * Event recorded by a Duelmon Combat History Entry.
 *
 * `start` records the initial combat and `action` records one action the turn
 * actually resolved.
 */
type DuelmonCombatHistoryEntryKind = 'action' | 'start';

/**
 * Actor, Move, and target identifiers of a recorded action.
 */
interface DuelmonCombatHistoryActionPrimitives {
	/**
	 * Acting combatant identifier.
	 */
	readonly actorId: string;
	/**
	 * Resolved Move identifier.
	 */
	readonly moveId: string;
	/**
	 * Target combatant identifier.
	 */
	readonly targetId: string;
}

/**
 * Serializable form of a Duelmon Combat History Entry.
 *
 * The `action` identifiers are present exactly when `kind` is `action`:
 * `kind === 'action'` if and only if `action` is present. A start entry keeps
 * them absent, so existing primitives stay compatible.
 */
interface DuelmonCombatHistoryEntryPrimitives {
	/**
	 * Actor, Move, and target of the recorded action, for `action` entries.
	 */
	readonly action?: DuelmonCombatHistoryActionPrimitives;
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
 * resolution. It never keeps a manual copy of the state. An action entry also
 * keeps the actor, Move, and target identifiers of the action it records.
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
	private readonly actionIdentity: DuelmonCombatHistoryActionPrimitives | undefined;
	private readonly snapshot: CombatPrimitives;

	private constructor(primitives: DuelmonCombatHistoryEntryPrimitives) {
		DuelmonCombatHistoryEntry.assertActionInvariant(primitives);
		this.kind = primitives.kind;
		this.text = primitives.text;
		this.actionIdentity = primitives.action ? structuredClone(primitives.action) : undefined;
		this.snapshot = structuredClone(primitives.combat);
	}

	/**
	 * Actor, Move, and target of the recorded action.
	 *
	 * @returns A detached copy of the action identifiers, or `undefined` for a
	 * start entry.
	 */
	get action(): DuelmonCombatHistoryActionPrimitives | undefined {
		return this.actionIdentity ? structuredClone(this.actionIdentity) : undefined;
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
	 * Records one action the turn actually resolved.
	 *
	 * @param combat - Successor combat snapshot produced by the action.
	 * @param action - Actor, Move, and target identifiers of the action.
	 * @returns The action entry.
	 */
	static action(combat: Combat, action: DuelmonCombatHistoryActionPrimitives): DuelmonCombatHistoryEntry {
		return new DuelmonCombatHistoryEntry({
			action,
			combat: combat.toPrimitives(),
			kind: 'action',
			text: [
				`${action.actorId} used ${action.moveId} on ${action.targetId}`,
				'',
				DuelmonCombatReport.fromCombat(combat).toString(),
			].join('\n'),
		});
	}

	/**
	 * Hydrates an entry from persisted primitives.
	 *
	 * @param primitives - Entry primitives already validated at write time.
	 * @returns The hydrated entry.
	 * @throws {InvalidArgumentError} When the action identifiers do not match the
	 * entry kind.
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
	 * Enforces the `kind === 'action'` if and only if `action` is present rule.
	 *
	 * @param primitives - Entry primitives to check.
	 * @throws {InvalidArgumentError} When the action identifiers do not match the
	 * entry kind.
	 */
	private static assertActionInvariant(primitives: DuelmonCombatHistoryEntryPrimitives): void {
		if ((primitives.kind === 'action') !== (primitives.action !== undefined)) {
			throw new InvalidArgumentError(
				'Action identifiers are required exactly when the entry kind is "action"',
				'DuelmonCombatHistoryEntry'
			);
		}
	}

	/**
	 * Serializable form of the entry.
	 *
	 * @returns The entry primitives.
	 */
	toPrimitives(): DuelmonCombatHistoryEntryPrimitives {
		const action = this.action;

		return {
			...(action && { action }),
			combat: this.combat,
			kind: this.kind,
			text: this.text,
		};
	}
}

export type {
	DuelmonCombatHistoryActionPrimitives,
	DuelmonCombatHistoryEntryKind,
	DuelmonCombatHistoryEntryPrimitives,
};
export { DuelmonCombatHistoryEntry };

export default DuelmonCombatHistoryEntry;
