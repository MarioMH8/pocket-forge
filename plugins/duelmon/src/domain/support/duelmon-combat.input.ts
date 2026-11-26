import Either from '@hexadrop/either';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';

import { DuelmonFailure } from './duelmon-failure';
import { DuelmonRecord } from './duelmon-record';
import type { DuelmonTarget } from './duelmon-target';
import { DuelmonTarget as DuelmonTargetValue } from './duelmon-target';

/**
 * Plugin-owned input accepted by the Duelmon action plugin.
 *
 * This is also the shape of a declared turn action: one actor, one Move, and
 * one target. The turn service will consume one declaration per actor; the
 * declaration is input, not state, so it is never stored in `Combat` and has
 * no pending or confirmed variant. Phase 1 move declarations target a
 * combatant through `{ scope: 'combatant', id }`.
 *
 * The input is parsed once by the plugin and then handed to the selected
 * action resolver with its target already shaped as a value object.
 */
class DuelmonCombatInput {
	/**
	 * Acting combatant identifier.
	 */
	readonly actorId: string;
	/**
	 * Move identifier used to look up the action set binding.
	 *
	 * A declaration carries exactly one Move; there is no default.
	 */
	readonly moveId: string;
	/**
	 * Target selection validated against the current Combat.
	 *
	 * Phase 1 turn declarations use the `combatant` scope with an id.
	 */
	readonly target: DuelmonTarget;

	private constructor(actorId: string, moveId: string, target: DuelmonTarget) {
		this.actorId = actorId;
		this.moveId = moveId;
		this.target = target;
	}

	/**
	 * Creates an input from already validated values.
	 *
	 * @param actorId - Acting combatant identifier.
	 * @param moveId - Move identifier.
	 * @param target - Parsed target selection.
	 * @returns An immutable input value.
	 * @example
	 * ```ts
	 * const input = DuelmonCombatInput.create(
	 * 	'combatant-a',
	 * 	'ember-burst',
	 * 	DuelmonTarget.create('combatant', 'combatant-b')
	 * );
	 * ```
	 */
	static create(actorId: string, moveId: string, target: DuelmonTarget): DuelmonCombatInput {
		return new DuelmonCombatInput(actorId, moveId, target);
	}

	/**
	 * Validates the plugin-owned input shape at runtime.
	 *
	 * The actor, Move, and target are all required. A missing or empty
	 * `moveId` is rejected instead of selecting a default Move.
	 *
	 * @param value - Untrusted plugin input.
	 * @returns The validated input, or structured `invalid-input` failures.
	 * @example
	 * ```ts
	 * const parsed = DuelmonCombatInput.parse({
	 * 	actorId: 'player-emberling',
	 * 	moveId: 'ember-burst',
	 * 	target: { scope: 'combatant', id: 'opponent-aquafin' },
	 * });
	 * ```
	 */
	static parse(value: unknown): Either<CombatResolutionError[], DuelmonCombatInput> {
		if (!DuelmonRecord.isRecord(value)) {
			return DuelmonFailure.fail('invalid-input', 'Duelmon combat input must be an object', 'input');
		}

		const { actorId, moveId, target } = value;

		if (!this.isNonEmptyString(actorId)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input actorId must be a non-empty string',
				'input.actorId'
			);
		}

		if (!this.isNonEmptyString(moveId)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input moveId must be a non-empty string',
				'input.moveId'
			);
		}

		const parsedTarget = DuelmonTargetValue.parse(target);

		if (parsedTarget.isLeft()) {
			return Either.left(parsedTarget.getLeft());
		}

		return Either.right(new DuelmonCombatInput(actorId, moveId, parsedTarget.getRight()));
	}

	/**
	 * Narrows an unknown value to a non-empty string.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is a non-empty string.
	 */
	private static isNonEmptyString(value: unknown): value is string {
		return typeof value === 'string' && value.trim().length > 0;
	}
}

export { DuelmonCombatInput };

export default DuelmonCombatInput;
