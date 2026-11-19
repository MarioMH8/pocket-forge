import Either from '@hexadrop/either';
import { CombatResolutionError } from '@pocket-forge/combat/domain';

import type { DuelmonTargetScope } from './modify-attribute.config';
import { isDuelmonTargetScope } from './modify-attribute.config';

type UnknownRecord = Record<string, unknown>;

/**
 * Scope selection carried by the duelmon plugin input.
 */
interface DuelmonCombatTarget {
	/**
	 * Optional target identifier. Required for `group` and `combatant`.
	 */
	readonly id?: string | undefined;
	/**
	 * Scope addressed by the action.
	 */
	readonly scope: DuelmonTargetScope;
}

/**
 * Plugin-owned input shape accepted by the duelmon action plugin.
 */
interface DuelmonCombatInput {
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
	readonly target: DuelmonCombatTarget;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidInput(message: string, path: string): CombatResolutionError[] {
	return [new CombatResolutionError('invalid-input', message, path)];
}

/**
 * Validates the plugin-owned input shape at runtime.
 *
 * @param input - Untrusted plugin input.
 * @returns The validated input, or structured `invalid-input` failures.
 */
function parseDuelmonCombatInput(input: unknown): Either<CombatResolutionError[], DuelmonCombatInput> {
	if (!isRecord(input)) {
		return Either.left(invalidInput('Duelmon combat input must be an object', 'input'));
	}

	const { actorId, moveId, target } = input;

	if (!isNonEmptyString(actorId)) {
		return Either.left(invalidInput('Duelmon combat input actorId must be a non-empty string', 'input.actorId'));
	}

	if (!isNonEmptyString(moveId)) {
		return Either.left(invalidInput('Duelmon combat input moveId must be a non-empty string', 'input.moveId'));
	}

	if (!isRecord(target)) {
		return Either.left(invalidInput('Duelmon combat input target must be an object', 'input.target'));
	}

	const scope = target['scope'];

	if (!isDuelmonTargetScope(scope)) {
		return Either.left(
			invalidInput(
				'Duelmon combat input target scope must be one of: combat, group, combatant',
				'input.target.scope'
			)
		);
	}

	const id = target['id'];

	if (id !== undefined && !isNonEmptyString(id)) {
		return Either.left(
			invalidInput('Duelmon combat input target id must be a non-empty string when provided', 'input.target.id')
		);
	}

	return Either.right({ actorId, moveId, target: { id, scope } });
}

export type { DuelmonCombatInput, DuelmonCombatTarget };
export { parseDuelmonCombatInput };
