/**
 * Terminal result of a Combat, as declared by an external completion rule.
 *
 * The neutral contract only distinguishes a winning group from a draw; it
 * defines no turn, intent, phase, or team model.
 */
interface CombatDrawOutcome {
	/**
	 * The combat ended without a winner.
	 */
	readonly status: 'draw';
}

interface CombatVictoryOutcome {
	/**
	 * The combat ended with a winning group.
	 */
	readonly status: 'victory';
	/**
	 * Identifier of the winning Combatant Group.
	 */
	readonly winnerGroupId: string;
}

type CombatOutcome = CombatDrawOutcome | CombatVictoryOutcome;

// An `export default` cannot reference a type under `verbatimModuleSyntax`.
// eslint-disable-next-line import/prefer-default-export
export type { CombatOutcome };
