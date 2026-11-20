import Either from '@hexadrop/either';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';

import { DuelmonFailure } from './duelmon-failure';
import { DuelmonRecord } from './duelmon-record';
import type { DuelmonTarget } from './duelmon-target';
import { DuelmonTarget as DuelmonTargetValue } from './duelmon-target';

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Plugin-owned input accepted by the Duelmon action plugin.
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
	 */
	readonly moveId: string;
	/**
	 * Target selection validated against the current Combat.
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
	 * @param value - Untrusted plugin input.
	 * @returns The validated input, or structured `invalid-input` failures.
	 */
	static parse(value: unknown): Either<CombatResolutionError[], DuelmonCombatInput> {
		if (!DuelmonRecord.isRecord(value)) {
			return DuelmonFailure.fail('invalid-input', 'Duelmon combat input must be an object', 'input');
		}

		const { actorId, moveId, target } = value;

		if (!isNonEmptyString(actorId)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input actorId must be a non-empty string',
				'input.actorId'
			);
		}

		if (!isNonEmptyString(moveId)) {
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
}

export { DuelmonCombatInput };

export default DuelmonCombatInput;
