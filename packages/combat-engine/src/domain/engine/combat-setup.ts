import type { CombatActionPlugin } from '../action/combat-action-plugin';
import type CombatActionSet from '../action/combat-action-set';
import type CombatCompletionRule from '../completion/combat-completion-rule';
import type CombatRuleset from '../ruleset/combat-ruleset';

/**
 * Collaborators that compose a {@link CombatSetup}.
 *
 * Each field matches the property of the same name on the resulting setup.
 */
interface CombatSetupInput {
	readonly actionSet: CombatActionSet;
	readonly actions: CombatActionPlugin;
	readonly completion: CombatCompletionRule;
	readonly ruleset: CombatRuleset;
}

/**
 * Immutable composition of the four Combat collaborators.
 *
 * A setup is a snapshot of the collaborators wired by the app. There is no
 * static compatibility check: a plugin and an action set that do not belong
 * together surface as an unknown action when the plugin resolves.
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
	 * Wires the four collaborators into an immutable setup.
	 *
	 * @param input - Collaborators that compose the setup.
	 * @returns The immutable setup.
	 * @example
	 * ```ts
	 * const setup = CombatSetup.create({ ruleset, actions, actionSet, completion });
	 * ```
	 */
	static create(input: CombatSetupInput): CombatSetup {
		return new CombatSetup(input);
	}
}

export type { CombatSetupInput };
export default CombatSetup;
