import DomainError from '@hexadrop/error';

/**
 * Reasons an initial combat state can be rejected.
 */
type DuelmonCombatStartErrorReason =
	| 'duplicate-id'
	| 'invalid-active-combatant'
	| 'invalid-attribute'
	| 'invalid-combat'
	| 'invalid-combatant-count'
	| 'invalid-group-count'
	| 'invalid-hp'
	| 'invalid-membership'
	| 'invalid-moves'
	| 'invalid-random-pocket'
	| 'invalid-request'
	| 'missing-attribute'
	| 'missing-id'
	| 'missing-moves'
	| 'missing-species'
	| 'missing-types'
	| 'unknown-move'
	| 'unknown-species'
	| 'unsupported-move';

/**
 * Structured rejection for the Duelmon combat start contract.
 *
 * Errors are aggregated and returned through `Either` instead of thrown, so a
 * failed start reports every violation and never returns a partial combat.
 */
class DuelmonCombatStartError extends DomainError {
	/**
	 * Optional dot-separated path to the offending field.
	 */
	readonly path: string | undefined;
	/**
	 * Machine-readable failure reason.
	 */
	readonly reason: DuelmonCombatStartErrorReason;

	constructor(reason: DuelmonCombatStartErrorReason, message: string, path?: string) {
		super('DuelmonCombatStartError', message, 'DCS(422)');
		this.path = path;
		this.reason = reason;
	}
}

export type { DuelmonCombatStartErrorReason };
export { DuelmonCombatStartError };

export default DuelmonCombatStartError;
