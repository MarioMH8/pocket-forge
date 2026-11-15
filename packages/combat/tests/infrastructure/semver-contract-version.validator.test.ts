import SemverContractVersionValidator from '@pocket-forge/combat/infrastructure';
import { describe, expect, it } from 'bun:test';

describe('SemverContractVersionValidator', () => {
	const validator = new SemverContractVersionValidator();

	it('accepts valid semver versions', () => {
		expect(validator.isValid('1.0.0')).toBe(true);
		expect(validator.isValid('1.2.3-beta.1')).toBe(true);
		expect(validator.isValid('1.2.3+build.5')).toBe(true);
	});

	it('rejects invalid semver versions', () => {
		expect(validator.isValid('')).toBe(false);
		expect(validator.isValid('1.0')).toBe(false);
		expect(validator.isValid('1..0')).toBe(false);
		expect(validator.isValid('^1.0.0')).toBe(false);
		expect(validator.isValid('nope')).toBe(false);
	});
});
