import Either from '@hexadrop/either';

import type { CombatActionPlugin } from '../action/combat-action-plugin';
import type CombatActionSet from '../action/combat-action-set';
import type CombatCompletionRule from '../completion/combat-completion-rule';
import type CombatRuleset from '../ruleset/combat-ruleset';
import CombatSetupError from './combat-setup.error';

/**
 * Collaborators that compose a Combat Setup.
 */
interface CombatSetupInput {
	/**
	 * Authored action set bound to Moves.
	 */
	readonly actionSet: CombatActionSet;
	/**
	 * Action plugin that resolves the bound actions.
	 */
	readonly actions: CombatActionPlugin;
	/**
	 * Completion rule that decides the outcome.
	 */
	readonly completion: CombatCompletionRule;
	/**
	 * Combat format the setup follows.
	 */
	readonly ruleset: CombatRuleset;
}

/**
 * Immutable, validated composition of the four Combat collaborators.
 *
 * A setup is a snapshot: it validates their static compatibility once, at
 * creation, so a Combat Engine can never be constructed from a plugin and an
 * action set that do not belong together. Mutating a plugin after setup
 * creation does not restart that validation.
 */
class CombatSetup {
	/**
	 * Authored action set bound to Moves.
	 */
	readonly actionSet: CombatActionSet;
	/**
	 * Action plugin that resolves the bound actions.
	 */
	readonly actions: CombatActionPlugin;
	/**
	 * Completion rule that decides the outcome.
	 */
	readonly completion: CombatCompletionRule;
	/**
	 * Combat format the setup follows.
	 */
	readonly ruleset: CombatRuleset;

	private constructor(input: CombatSetupInput) {
		this.ruleset = input.ruleset;
		this.actions = input.actions;
		this.actionSet = input.actionSet;
		this.completion = input.completion;
		Object.freeze(this);
	}

	/**
	 * Validates the static compatibility of the four collaborators and builds
	 * an immutable setup.
	 *
	 * The action plugin must support the configured action set. Every other
	 * check belongs to the Combat Engine and runs per resolution.
	 *
	 * @param input - Collaborators that compose the setup.
	 * @returns The validated setup, or every setup failure.
	 */
	static create(input: CombatSetupInput): Either<CombatSetupError[], CombatSetup> {
		if (!input.actions.supports(input.actionSet)) {
			return Either.left([
				new CombatSetupError(
					'incompatible-action-set',
					`Action plugin "${input.actions.id}" does not support the configured action set`,
					'actions'
				),
			]);
		}

		return Either.right(new CombatSetup(input));
	}
}

export type { CombatSetupInput };
export default CombatSetup;
