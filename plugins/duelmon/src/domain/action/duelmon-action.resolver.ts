import type Either from '@hexadrop/either';
import type {
	CombatActionBinding,
	CombatActionContext,
	CombatResolutionError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';

import type { DuelmonCombatInput } from '../support';

/**
 * Resolves one Duelmon action bound to a Move.
 *
 * Resolvers are selected by action identifier and receive the already parsed
 * input plus the binding that selected the action. Implementations are pure:
 * failures leave the previous combat unchanged and consume no randomness.
 */
export default interface DuelmonActionResolver {
	/**
	 * Resolves the bound action into a successor combat and ordered events.
	 *
	 * @param context - Immutable action context.
	 * @param input - Parsed Duelmon input.
	 * @param binding - Action binding that selected this action.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(
		context: CombatActionContext,
		input: DuelmonCombatInput,
		binding: CombatActionBinding
	): Either<CombatResolutionError[], CombatTransition>;
}
