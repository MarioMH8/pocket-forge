import { CombatRulesetError } from '@pocket-forge/combat/domain';
import { describe, expect, it } from 'bun:test';

describe('CombatRulesetError', () => {
	it('exposes a stable name and domain error code', () => {
		const error = new CombatRulesetError('invalid-name', 'Name is required', 'name');

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('CombatRulesetError');
		expect(error.code).toBe('CRS(422)');
		expect(error.errorCode).toBe(422);
	});

	it('stores the reason and path', () => {
		const error = new CombatRulesetError('invalid-attribute', 'Unknown attribute', 'attributes.unknown');

		expect(error.reason).toBe('invalid-attribute');
		expect(error.path).toBe('attributes.unknown');
		expect(error.message).toBe('Unknown attribute');
	});

	it('allows an omitted path', () => {
		const error = new CombatRulesetError('invalid-constraints', 'Invalid constraints');

		expect(error.path).toBeUndefined();
	});
});
