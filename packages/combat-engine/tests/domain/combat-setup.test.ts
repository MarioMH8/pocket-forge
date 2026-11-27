import { CombatSetup } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

import { EngineFakes, FakeActionResolver, FakeCompletionRule, FakeCompositionRule } from './engine.fakes';

describe('CombatEngineSetup', () => {
	it('creates a setup from its collaborators and exposes them unchanged', () => {
		const actions = new FakeActionResolver();
		const bindings = EngineFakes.actionBindings();
		const composition = new FakeCompositionRule();
		const completion = new FakeCompletionRule();

		const setup = CombatSetup.create({ actionBindings: bindings, actions, rules: [composition, completion] });

		expect(setup.actions).toBe(actions);
		expect(setup.actionBindings).toBe(bindings);
		expect(setup.rules).toEqual([composition, completion]);
		expect(Object.isFrozen(setup)).toBe(true);
		expect(Object.isFrozen(setup.rules)).toBe(true);
	});
});
