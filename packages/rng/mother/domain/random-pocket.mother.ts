import { faker } from '@faker-js/faker';
import RandomPocket from '@pocket-forge/rng/domain';

export default class RandomPocketMother {
	/**
	 * Creates a RandomPocket with a random seed.
	 */
	static create(overrides?: { seed?: number }): RandomPocket {
		return RandomPocket.create(overrides?.seed ?? faker.number.int({ max: 4_294_967_295, min: 0 }));
	}

	/**
	 * Creates a RandomPocket with a fixed seed for deterministic tests.
	 */
	static fixed(): RandomPocket {
		return RandomPocket.create(42);
	}

	/**
	 * Hydrates a RandomPocket from primitives without re-initialising.
	 */
	static fromPrimitives(overrides?: { seed?: number; state?: number }): RandomPocket {
		return RandomPocket.fromPrimitives({
			seed: overrides?.seed ?? faker.number.int({ max: 4_294_967_295, min: 0 }),
			state: overrides?.state ?? faker.number.int({ max: 4_294_967_295, min: 0 }),
		});
	}
}
