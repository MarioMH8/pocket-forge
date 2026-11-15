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

	it('accepts valid semver ranges', () => {
		expect(validator.isValidRange('1.0.0')).toBe(true);
		expect(validator.isValidRange('^1.0.0')).toBe(true);
		expect(validator.isValidRange('~1.2.0')).toBe(true);
		expect(validator.isValidRange('>=1.0.0 <2.0.0')).toBe(true);
		expect(validator.isValidRange('*')).toBe(true);
	});

	it('rejects invalid semver ranges', () => {
		expect(validator.isValidRange('not-a-range')).toBe(false);
		expect(validator.isValidRange('1.0.0 -')).toBe(false);
	});

	it('checks whether a version satisfies a range', () => {
		expect(validator.satisfies('1.2.0', '^1.0.0')).toBe(true);
		expect(validator.satisfies('1.0.0', '^1.0.0')).toBe(true);
		expect(validator.satisfies('2.0.0', '^1.0.0')).toBe(false);
		expect(validator.satisfies('1.0.0', '^2.0.0')).toBe(false);
		expect(validator.satisfies('nope', '^1.0.0')).toBe(false);
	});
});
