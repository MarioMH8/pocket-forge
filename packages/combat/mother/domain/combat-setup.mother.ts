import type { CombatSetupInput } from '@pocket-forge/combat/domain';
import { CombatSetup } from '@pocket-forge/combat/domain';

/**
 * Builds a valid Combat Setup for tests.
 *
 * Collaborators are supplied by the caller: a setup needs a concrete ruleset,
 * plugin, action set, and completion rule, and each test wires its own.
 */
export default class CombatSetupMother {
	/**
	 * Builds a valid setup, failing the test when the composition is invalid.
	 *
	 * @param input - Collaborators that compose the setup.
	 * @returns The validated setup.
	 */
	static create(input: CombatSetupInput): CombatSetup {
		const result = CombatSetup.create(input);

		if (result.isLeft()) {
			throw new Error(
				result
					.getLeft()
					.map(error => error.message)
					.join(', ')
			);
		}

		return result.getRight();
	}
}
