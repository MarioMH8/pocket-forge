import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Primitives } from '@hexadrop/types/primitives';

/**
 * A seedable, deterministic pseudo-random number generator for Pocket Forge.
 *
 * RandomPocket is the single source of randomness for all game systems —
 * battles, encounters, loot, procedural generation, and more. It wraps a
 * mulberry32 PRNG so the same seed always produces the same sequence,
 * making gameplay reproducible and testable.
 *
 * Every mutation (like calling {@link next}) advances the internal state
 * and returns a new instance, keeping the entity immutable.
 *
 * @example
 * ```ts
 * // Create with a seed
 * const rng = RandomPocket.create(12345);
 *
 * // Basic random
 * const [roll, rng2] = rng.nextInt(1, 20);   // d20 roll
 * const [crit, rng3] = rng2.chance(0.05);     // 5% crit chance
 *
 * // Game operations
 * const [target, rng4] = rng3.pickOne(['goblin', 'orc', 'troll']);
 * const [loot, rng5] = rng4.pickWeighted(
 *   ['potion', 'sword', 'shield'],
 *   [0.6, 0.3, 0.1]
 * );
 * const [shuffled] = rng5.shuffle([1, 2, 3, 4, 5]);
 * ```
 */
export default class RandomPocket {
	/**
	 * The original seed used to initialise this generator.
	 */
	readonly seed: number;
	/**
	 * The current internal PRNG state.
	 */
	readonly state: number;

	private constructor(primitives: Primitives<RandomPocket>) {
		this.seed = primitives.seed;
		this.state = primitives.state;
	}

	/**
	 * Creates a new RandomPocket initialised with the given seed.
	 *
	 * @param seed - A 32-bit integer seed. The same seed always produces
	 *               the same sequence of random values.
	 * @returns A fresh RandomPocket ready for use.
	 */
	static create(seed: number): RandomPocket {
		if (typeof seed !== 'number' || !Number.isFinite(seed)) {
			throw new InvalidArgumentError('RandomPocket seed must be a finite number', 'RandomPocket');
		}

		// Coerce to unsigned 32-bit
		// eslint-disable-next-line no-bitwise, unicorn/prefer-math-trunc
		const state = (seed | 0) >>> 0;

		return new RandomPocket({ seed: state, state });
	}

	/**
	 * Hydrates a RandomPocket from primitives without re-initialising.
	 *
	 * Use this when restoring from a persistence layer where the RNG
	 * state was already validated at write time.
	 *
	 * @param primitives - Plain object with `seed` and `state`.
	 * @returns A rehydrated RandomPocket.
	 */
	static fromPrimitives(primitives: Primitives<RandomPocket>): RandomPocket {
		return new RandomPocket(primitives);
	}

	/**
	 * Returns a random boolean with the given probability of `true`.
	 *
	 * @param probability - Value between 0 and 1 (inclusive).
	 * @returns A tuple of `[result, nextRng]`.
	 */
	chance(probability: number): [boolean, RandomPocket] {
		const [value, nextRng] = this.next();

		return [value < probability, nextRng];
	}

	/**
	 * Returns a random number from a normal (Gaussian) distribution
	 * using the Box-Muller transform.
	 *
	 * Consumes two random values internally.
	 *
	 * @param mean - Mean of the distribution (default 0).
	 * @param stddev - Standard deviation (default 1).
	 * @returns A tuple of `[value, nextRng]`.
	 */
	gaussian(mean = 0, stddev = 1): [number, RandomPocket] {
		const [u1, rng1] = this.next();
		const [u2, rng2] = rng1.next();

		// Box-Muller transform
		const z = Math.sqrt(-2 * Math.log(u1 || Number.MIN_VALUE)) * Math.cos(2 * Math.PI * u2);

		return [mean + z * stddev, rng2];
	}

	/**
	 * Advances the PRNG and returns the next random float in [0, 1).
	 *
	 * Uses the mulberry32 algorithm — fast, well-distributed, and
	 * deterministic for any given seed.
	 *
	 * @returns A tuple of `[value, nextRng]` where `value` is in [0, 1)
	 *          and `nextRng` is the new RandomPocket with advanced state.
	 */
	next(): [number, RandomPocket] {
		/* eslint-disable no-bitwise, unicorn/prefer-math-trunc, unicorn/number-literal-case */
		let t = (this.state + 0x6d_2b_79_f5) | 0;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		const nextState = (t ^ (t >>> 14)) >>> 0;
		/* eslint-enable no-bitwise, unicorn/prefer-math-trunc, unicorn/number-literal-case */

		const value = nextState / 4_294_967_296;

		return [value, new RandomPocket({ seed: this.seed, state: nextState })];
	}

	/**
	 * Returns a random integer in [min, max] (both inclusive).
	 *
	 * @param min - Lower bound (inclusive).
	 * @param max - Upper bound (inclusive).
	 * @returns A tuple of `[value, nextRng]`.
	 */
	nextInt(min: number, max: number): [number, RandomPocket] {
		const [value, nextRng] = this.next();

		return [Math.floor(min + value * (max - min + 1)), nextRng];
	}

	/**
	 * Picks a random element from a non-empty array.
	 *
	 * @param items - Array to pick from. Must have at least one element.
	 * @returns A tuple of `[item, nextRng]`.
	 */
	pickOne<T>(items: readonly T[]): [T, RandomPocket] {
		const [index, nextRng] = this.nextInt(0, items.length - 1);

		return [items[index] as T, nextRng];
	}

	/**
	 * Picks a random element using weighted probabilities.
	 *
	 * Each weight must be >= 0 and at least one must be > 0.
	 * Weights are normalised internally so they don't need to sum to 1.
	 *
	 * @param items - Array of items to pick from.
	 * @param weights - Corresponding weights for each item.
	 * @returns A tuple of `[item, nextRng]`.
	 */
	pickWeighted<T>(items: readonly T[], weights: readonly number[]): [T, RandomPocket] {
		const totalWeight = weights.reduce((sum, w) => sum + w, 0);
		const [value, nextRng] = this.next();
		const threshold = value * totalWeight;
		let accumulated = 0;

		for (const [index, item] of items.entries()) {
			accumulated += weights.at(index) ?? 0;
			if (threshold < accumulated) {
				return [item, nextRng];
			}
		}

		// Fallback: return last item (handles floating-point edge cases)
		return [items.at(-1) as T, nextRng];
	}

	/**
	 * Returns a random floating-point number in [min, max).
	 *
	 * @param min - Lower bound (inclusive).
	 * @param max - Upper bound (exclusive).
	 * @returns A tuple of `[value, nextRng]`.
	 */
	range(min: number, max: number): [number, RandomPocket] {
		const [value, nextRng] = this.next();

		return [min + value * (max - min), nextRng];
	}

	/**
	 * Rolls multiple dice and returns the sum.
	 *
	 * @param count - Number of dice to roll.
	 * @param sides - Number of sides per die.
	 * @returns A tuple of `[total, nextRng]`.
	 */
	rollDice(count: number, sides: number): [number, RandomPocket] {
		return Array.from({ length: count }).reduce<[number, RandomPocket]>(
			([total, rng]) => {
				const [roll, nextRng] = rng.rollDie(sides);

				return [total + roll, nextRng];
			},
			[0, this]
		);
	}

	/**
	 * Rolls a die with the given number of sides.
	 *
	 * Equivalent to `nextInt(1, sides)`.
	 *
	 * @param sides - Number of sides on the die (e.g. 6, 20).
	 * @returns A tuple of `[result, nextRng]`.
	 */
	rollDie(sides: number): [number, RandomPocket] {
		return this.nextInt(1, sides);
	}

	/**
	 * Returns a new shuffled copy of the array using Fisher-Yates.
	 *
	 * The original array is not modified.
	 *
	 * @param items - Array to shuffle.
	 * @returns A tuple of `[shuffled, nextRng]`.
	 */
	shuffle<T>(items: readonly T[]): [T[], RandomPocket] {
		const result = [...items];

		return result.reduceRight<[T[], RandomPocket]>(
			([array, rng], _, index) => {
				if (index === 0) {
					return [array, rng];
				}
				const [swapIndex, nextRng] = rng.nextInt(0, index);
				const temporary = array[index] as T;
				array[index] = array[swapIndex] as T;
				array[swapIndex] = temporary;

				return [array, nextRng];
			},
			[result, this]
		);
	}

	/**
	 * Serialises this RandomPocket into a plain object suitable for
	 * persistence or transport.
	 */
	toPrimitives(): Primitives<RandomPocket> {
		return { seed: this.seed, state: this.state };
	}
}
