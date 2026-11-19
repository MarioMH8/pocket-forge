import { CombatSetup } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

import { actionSet, FakeActionPlugin, FakeCombatRuleset, FakeCompletionRule } from './engine.fakes';

describe('CombatSetup', () => {
	it('creates a setup from four collaborators and exposes them unchanged', () => {
		const completion = new FakeCompletionRule();
		const ruleset = new FakeCombatRuleset();
		const actions = new FakeActionPlugin();
		const set = actionSet();

		const setup = CombatSetup.create({ actions, actionSet: set, completion, ruleset });

		expect(setup.ruleset).toBe(ruleset);
		expect(setup.actions).toBe(actions);
		expect(setup.actionSet).toBe(set);
		expect(setup.completion).toBe(completion);
		expect(Object.isFrozen(setup)).toBe(true);
	});
});
