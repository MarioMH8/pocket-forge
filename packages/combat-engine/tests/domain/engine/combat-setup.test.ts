import { CombatSetup } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

import { FakeActionResolver, FakeCompletionRule, FakeCompositionRule, moveBindings } from './engine.fakes';

describe('CombatSetup', () => {
	it('creates a setup from its collaborators and exposes them unchanged', () => {
		const actions = new FakeActionResolver();
		const bindings = moveBindings();
		const composition = new FakeCompositionRule();
		const completion = new FakeCompletionRule();

		const setup = CombatSetup.create({ actions, moveBindings: bindings, rules: [composition, completion] });

		expect(setup.actions).toBe(actions);
		expect(setup.moveBindings).toBe(bindings);
		expect(setup.rules).toEqual([composition, completion]);
		expect(Object.isFrozen(setup)).toBe(true);
		expect(Object.isFrozen(setup.rules)).toBe(true);
	});
});
