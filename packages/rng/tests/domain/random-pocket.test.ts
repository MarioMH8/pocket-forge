import RandomPocket from '@pocket-forge/rng/domain';
import { RandomPocketMother } from '@pocket-forge/rng/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('RandomPocket', () => {
	describe('create', () => {
		it('creates a RandomPocket with the given seed', () => {
			const rng = RandomPocket.create(12_345);

			expect(rng.seed).toBe(12_345);
			expect(rng.state).toBe(12_345);
		});

		it('throws when seed is NaN', () => {
			expect(() => RandomPocket.create(NaN)).toThrow();
		});

		it('throws when seed is Infinity', () => {
			expect(() => RandomPocket.create(Infinity)).toThrow();
		});

		it('coerces negative seeds to unsigned 32-bit', () => {
			const rng = RandomPocket.create(-1);

			expect(rng.seed).toBe(4_294_967_295);
		});

		it('coerces large seeds to unsigned 32-bit', () => {
			const rng = RandomPocket.create(4_294_967_296);

			expect(rng.seed).toBe(0);
		});
	});

	describe('determinism', () => {
		it('produces the same sequence for the same seed', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const results1: number[] = [];
			const results2: number[] = [];
			let a = rng1;
			let b = rng2;

			for (let index = 0; index < 10; index++) {
				const [v1, nextA] = a.next();
				const [v2, nextB] = b.next();
				results1.push(v1);
				results2.push(v2);
				a = nextA;
				b = nextB;
			}

			expect(results1).toEqual(results2);
		});

		it('produces different sequences for different seeds', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(99);

			const [v1] = rng1.next();
			const [v2] = rng2.next();

			expect(v1).not.toBe(v2);
		});
	});

	describe('next', () => {
		it('returns a value in [0, 1)', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 100; index++) {
				const [value] = rng.next();
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThan(1);
			}
		});

		it('advances the state on each call', () => {
			const rng = RandomPocketMother.fixed();
			const [, rng2] = rng.next();

			expect(rng2.state).not.toBe(rng.state);
		});

		it('is immutable — original instance is unchanged', () => {
			const rng = RandomPocketMother.fixed();
			const originalState = rng.state;

			rng.next();

			expect(rng.state).toBe(originalState);
		});
	});

	describe('chance', () => {
		it('returns true with probability 1', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 20; index++) {
				const [result] = rng.chance(1);
				expect(result).toBe(true);
			}
		});

		it('returns false with probability 0', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 20; index++) {
				const [result] = rng.chance(0);
				expect(result).toBe(false);
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [r1] = rng1.chance(0.5);
			const [r2] = rng2.chance(0.5);

			expect(r1).toBe(r2);
		});
	});

	describe('range', () => {
		it('returns a value in [min, max)', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 100; index++) {
				const [value] = rng.range(5, 10);
				expect(value).toBeGreaterThanOrEqual(5);
				expect(value).toBeLessThan(10);
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [v1] = rng1.range(0, 100);
			const [v2] = rng2.range(0, 100);

			expect(v1).toBe(v2);
		});
	});

	describe('nextInt', () => {
		it('returns an integer in [min, max] inclusive', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 100; index++) {
				const [value] = rng.nextInt(1, 6);
				expect(value).toBeGreaterThanOrEqual(1);
				expect(value).toBeLessThanOrEqual(6);
				expect(Number.isSafeInteger(value)).toBe(true);
			}
		});

		it('returns min when range is zero', () => {
			const rng = RandomPocketMother.fixed();
			const [value] = rng.nextInt(5, 5);

			expect(value).toBe(5);
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [v1] = rng1.nextInt(1, 100);
			const [v2] = rng2.nextInt(1, 100);

			expect(v1).toBe(v2);
		});
	});

	describe('rollDie', () => {
		it('returns a value between 1 and sides inclusive', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 100; index++) {
				const [value] = rng.rollDie(20);
				expect(value).toBeGreaterThanOrEqual(1);
				expect(value).toBeLessThanOrEqual(20);
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [v1] = rng1.rollDie(20);
			const [v2] = rng2.rollDie(20);

			expect(v1).toBe(v2);
		});
	});

	describe('rollDice', () => {
		it('returns sum in [count, count * sides]', () => {
			const rng = RandomPocketMother.fixed();

			for (let index = 0; index < 50; index++) {
				const [total] = rng.rollDice(3, 6);
				expect(total).toBeGreaterThanOrEqual(3);
				expect(total).toBeLessThanOrEqual(18);
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [t1] = rng1.rollDice(3, 6);
			const [t2] = rng2.rollDice(3, 6);

			expect(t1).toBe(t2);
		});
	});

	describe('pickOne', () => {
		it('returns an element from the array', () => {
			const rng = RandomPocketMother.fixed();
			const items = ['a', 'b', 'c', 'd', 'e'];

			for (let index = 0; index < 50; index++) {
				const [item] = rng.pickOne(items);
				expect(items).toContain(item);
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);
			const items = ['x', 'y', 'z'];

			const [index1] = rng1.pickOne(items);
			const [index2] = rng2.pickOne(items);

			expect(index1).toBe(index2);
		});
	});

	describe('pickWeighted', () => {
		it('returns an element from the items array', () => {
			const rng = RandomPocketMother.fixed();
			const items = ['common', 'rare', 'epic'];
			const weights = [0.7, 0.25, 0.05];

			for (let index = 0; index < 50; index++) {
				const [item] = rng.pickWeighted(items, weights);
				expect(items).toContain(item);
			}
		});

		it('always picks the only item with positive weight', () => {
			const rng = RandomPocketMother.fixed();
			const items = ['a', 'b', 'c'];
			const weights = [0, 1, 0];

			for (let index = 0; index < 20; index++) {
				const [item] = rng.pickWeighted(items, weights);
				expect(item).toBe('b');
			}
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);
			const items = ['a', 'b', 'c'];
			const weights = [0.5, 0.3, 0.2];

			const [index1] = rng1.pickWeighted(items, weights);
			const [index2] = rng2.pickWeighted(items, weights);

			expect(index1).toBe(index2);
		});
	});

	describe('shuffle', () => {
		it('returns an array with the same elements', () => {
			const rng = RandomPocketMother.fixed();
			const items = [1, 2, 3, 4, 5];

			const [shuffled] = rng.shuffle(items);

			expect(shuffled).toHaveLength(items.length);
			expect(shuffled.toSorted((a, b) => a - b)).toEqual(items.toSorted((a, b) => a - b));
		});

		it('does not mutate the original array', () => {
			const rng = RandomPocketMother.fixed();
			const items = [1, 2, 3, 4, 5];
			const original = [...items];

			rng.shuffle(items);

			expect(items).toEqual(original);
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);
			const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

			const [s1] = rng1.shuffle(items);
			const [s2] = rng2.shuffle(items);

			expect(s1).toEqual(s2);
		});
	});

	describe('gaussian', () => {
		it('returns a number', () => {
			const rng = RandomPocketMother.fixed();
			const [value] = rng.gaussian();

			expect(typeof value).toBe('number');
			expect(Number.isNaN(value)).toBe(false);
		});

		it('is deterministic', () => {
			const rng1 = RandomPocket.create(42);
			const rng2 = RandomPocket.create(42);

			const [v1] = rng1.gaussian(10, 2);
			const [v2] = rng2.gaussian(10, 2);

			expect(v1).toBe(v2);
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates without re-initialising', () => {
			const rng = RandomPocketMother.fromPrimitives({ seed: 42, state: 999 });

			expect(rng.seed).toBe(42);
			expect(rng.state).toBe(999);
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object with seed and state', () => {
			const rng = RandomPocket.create(42);
			const [, nextRng] = rng.next();

			const primitives = nextRng.toPrimitives();

			expect(primitives.seed).toBe(42);
			expect(typeof primitives.state).toBe('number');
			expect(primitives.state).toBe(nextRng.state);
		});
	});

	describe('round-trip', () => {
		it('serialises and deserialises preserving state', () => {
			const rng = RandomPocket.create(42);
			const [, rng2] = rng.next();
			const [, rng3] = rng2.nextInt(1, 100);

			const primitives = rng3.toPrimitives();
			const restored = RandomPocket.fromPrimitives(primitives);

			expect(restored.seed).toBe(rng3.seed);
			expect(restored.state).toBe(rng3.state);

			// Both should produce the same next value
			const [v1] = rng3.next();
			const [v2] = restored.next();

			expect(v1).toBe(v2);
		});
	});
});
