/**
 * Terminal result of a Combat, as declared by an external completion rule.
 *
 * The neutral contract only distinguishes a winning group from a draw; it
 * defines no turn, intent, phase, or team model.
 */
abstract class CombatOutcome {
	/**
	 * Whether the combat ended without a winner.
	 */
	abstract readonly status: 'draw' | 'victory';

	/**
	 * Creates a draw outcome.
	 *
	 * @returns The draw outcome.
	 */
	static draw(): CombatOutcome {
		// eslint-disable-next-line no-use-before-define
		return CombatDrawOutcome.create();
	}

	/**
	 * Creates a victory outcome.
	 *
	 * @param winnerGroupId - Identifier of the winning Combatant Group.
	 * @returns The victory outcome.
	 */
	static victory(winnerGroupId: string): CombatOutcome {
		// eslint-disable-next-line no-use-before-define
		return CombatVictoryOutcome.create(winnerGroupId);
	}

	/**
	 * Narrows a draw outcome.
	 *
	 * @returns Whether the combat ended without a winner.
	 */
	isDraw(): this is CombatDrawOutcome {
		return this.status === 'draw';
	}

	/**
	 * Narrows a victory outcome.
	 *
	 * @returns Whether the combat ended with a winning group.
	 */
	isVictory(): this is CombatVictoryOutcome {
		return this.status === 'victory';
	}
}

class CombatDrawOutcome extends CombatOutcome {
	readonly status = 'draw' as const;

	private constructor() {
		super();
		Object.freeze(this);
	}

	static create(): CombatDrawOutcome {
		return new CombatDrawOutcome();
	}
}

class CombatVictoryOutcome extends CombatOutcome {
	readonly status = 'victory' as const;
	readonly winnerGroupId: string;

	private constructor(winnerGroupId: string) {
		super();
		this.winnerGroupId = winnerGroupId;
		Object.freeze(this);
	}

	static create(winnerGroupId: string): CombatVictoryOutcome {
		return new CombatVictoryOutcome(winnerGroupId);
	}
}

export default CombatOutcome;
