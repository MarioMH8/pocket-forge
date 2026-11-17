import { CombatSetup, CombatSetupError } from '@pocket-forge/combat/domain';
import { describe, expect, it } from 'bun:test';

import { actionSet, FakeActionPlugin, FakeCombatRuleset, FakeCompletionRule } from './engine.fakes';

describe('CombatSetup', () => {
	it('creates a setup from four compatible collaborators and exposes them unchanged', () => {
		const completion = new FakeCompletionRule();
		const ruleset = new FakeCombatRuleset();
		const actions = new FakeActionPlugin();
		const set = actionSet();

		const result = CombatSetup.create({ actions, actionSet: set, completion, ruleset });

		expect(result.isRight()).toBe(true);

		const setup = result.getRight();

		expect(setup.ruleset).toBe(ruleset);
		expect(setup.actions).toBe(actions);
		expect(setup.actionSet).toBe(set);
		expect(setup.completion).toBe(completion);
		expect(Object.isFrozen(setup)).toBe(true);
	});

	it('rejects a plugin that does not support the action set', () => {
		const actions = new FakeActionPlugin();
		actions.supported = false;

		const result = CombatSetup.create({
			actions,
			actionSet: actionSet(),
			completion: new FakeCompletionRule(),
			ruleset: new FakeCombatRuleset(),
		});

		expect(result.isLeft()).toBe(true);

		const error = result.getLeft()[0];

		expect(result.getLeft()).toHaveLength(1);
		expect(error).toBeInstanceOf(CombatSetupError);
		expect(error?.reason).toBe('incompatible-action-set');
		expect(error?.path).toBe('actions');
		expect(error?.message).toMatch(/Action plugin "fake-plugin" does not support the configured action set/);
	});
});
