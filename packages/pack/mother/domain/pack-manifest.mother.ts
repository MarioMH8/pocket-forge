import { faker } from '@faker-js/faker';
import type { PackManifestPrimitives } from '@pocket-forge/pack/domain';
import { PackManifest } from '@pocket-forge/pack/domain';

export default class PackManifestMother {
	static create(overrides?: Partial<PackManifestPrimitives>): PackManifest {
		const result = PackManifest.create(this.primitives(overrides));

		if (result.isLeft()) {
			throw new Error(
				result
					.getLeft()
					.map(error => error.message)
					.join(', ')
			);
		}

		return result.getRight();
	}

	static primitives(overrides?: Partial<PackManifestPrimitives>): PackManifestPrimitives {
		return {
			contracts: { moves: 1 },
			contributions: [{ kind: 'moves', path: 'content/moves.json' }],
			extensions: [],
			id: faker.string.uuid(),
			version: '1.0.0',
			...overrides,
		};
	}
}
