import { Gen1Damage } from '@pocket-forge/duelmon/domain';
import { describe, expect, it } from 'bun:test';

const BASE_INPUT = {
	attack: 100,
	defense: 100,
	level: 50,
	power: 80,
	randomFactor: 255,
	stab: false,
	typeMultipliers: [1],
} as const;

class DamageFixture {
	static damage(input: Parameters<typeof Gen1Damage.calculate>[0]): number {
		return Gen1Damage.calculate(input).amount;
	}
}

describe('Gen1Damage.calculate', () => {
	it('computes the Gen 1 base damage with integer truncation', () => {
		expect(DamageFixture.damage(BASE_INPUT)).toBe(37);
		expect(DamageFixture.damage({ ...BASE_INPUT, randomFactor: 217 })).toBe(31);
	});

	it('truncates at each step of the formula', () => {
		expect(
			DamageFixture.damage({
				attack: 50,
				defense: 60,
				level: 5,
				power: 40,
				randomFactor: 255,
				stab: false,
				typeMultipliers: [1],
			})
		).toBe(4);
	});

	it('applies the STAB multiplier', () => {
		expect(DamageFixture.damage({ ...BASE_INPUT, stab: true })).toBe(55);
	});

	it('applies type effectiveness', () => {
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [2] })).toBe(74);
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [0.5] })).toBe(18);
	});

	it('truncates after each defender-type multiplier', () => {
		// Ice against Water/Flying: floor(37 * 0.5) = 18, then floor(18 * 2) = 36.
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [0.5, 2] })).toBe(36);
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [2, 0.5] })).toBe(37);
	});

	it('returns zero for an immune matchup', () => {
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [0] })).toBe(0);
		expect(DamageFixture.damage({ ...BASE_INPUT, typeMultipliers: [1, 0] })).toBe(0);
	});

	it('deals at least one damage to a non-immune target', () => {
		expect(
			DamageFixture.damage({
				attack: 1,
				defense: 255,
				level: 1,
				power: 1,
				randomFactor: 217,
				stab: false,
				typeMultipliers: [0.5],
			})
		).toBe(1);
	});
});
