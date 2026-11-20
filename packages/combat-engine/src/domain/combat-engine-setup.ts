import type { CombatActionResolver } from './action/combat-action.resolver';
import type CombatMoveBindingSet from './action/combat-move-binding-set';
import type CombatRule from './rule/combat-rule';

/**
 * Collaborators that compose a {@link CombatEngineSetup}.
 *
 * Each field matches the property of the same name on the resulting setup.
 */
interface CombatEngineSetupInput {
	/**
	 * Action resolver that resolves the bound actions.
	 */
	readonly actions: CombatActionResolver;
	/**
	 * Move bindings handled by the action resolver.
	 */
	readonly moveBindings: CombatMoveBindingSet;
	/**
	 * Rules that participate in the combat.
	 */
	readonly rules: readonly CombatRule[];
}

/**
 * Immutable composition of the Combat collaborators.
 *
 * A setup is a snapshot of the collaborators wired by the app. There is no
 * static compatibility check: a resolver and a binding set that do not belong
 * together surface as an unknown action when the resolver runs.
 */
class CombatEngineSetup {
	/**
	 * Action resolver that resolves the bound actions.
	 */
	readonly actions: CombatActionResolver;
	/**
	 * Authored Move bindings handled by the resolver.
	 */
	readonly moveBindings: CombatMoveBindingSet;
	/**
	 * Rules that participate in the combat.
	 */
	readonly rules: readonly CombatRule[];

	private constructor(input: CombatEngineSetupInput) {
		this.rules = Object.freeze([...input.rules]);
		this.actions = input.actions;
		this.moveBindings = input.moveBindings;
		Object.freeze(this);
	}

	/**
	 * Wires the collaborators into an immutable setup.
	 *
	 * @param input - Collaborators that compose the setup.
	 * @returns The immutable setup.
	 * @example
	 * ```ts
	 * const setup = CombatEngineSetup.create({ rules, actions, moveBindings });
	 * ```
	 */
	static create(input: CombatEngineSetupInput): CombatEngineSetup {
		return new CombatEngineSetup(input);
	}
}

export type { CombatEngineSetupInput };
export default CombatEngineSetup;
