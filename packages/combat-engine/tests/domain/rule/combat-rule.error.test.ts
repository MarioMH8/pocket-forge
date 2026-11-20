import { CombatRuleError } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

describe('CombatRuleError', () => {
	it('exposes the rule error code and reason', () => {
		const error = new CombatRuleError('invalid-attribute', 'Invalid attribute', 'attributes.power');

		expect(error).toBeInstanceOf(CombatRuleError);
		expect(error.code).toBe('CRL(422)');
		expect(error.reason).toBe('invalid-attribute');
		expect(error.path).toBe('attributes.power');
	});
});
