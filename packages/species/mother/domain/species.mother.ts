import { faker } from '@faker-js/faker';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';
import { Species } from '@pocket-forge/species/domain';

export default class SpeciesMother {
	static create(overrides?: {
		definitions?: AttributeDefinition[];
		id?: string;
		name?: string;
		values?: AttributeValues;
	}): Species {
		const definitions = overrides?.definitions ?? [AttributeDefinitionMother.string()];
		const values = overrides?.values ?? Object.fromEntries(definitions.map(d => [d.key, d.defaultValue]));

		return Species.create(
			overrides?.id ?? faker.string.ulid(),
			overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			values,
			definitions
		);
	}

	static fromPrimitives(overrides?: Partial<SpeciesPrimitives>): Species {
		return Species.fromPrimitives({
			attributes: overrides?.attributes ?? {},
			id: overrides?.id ?? faker.string.ulid(),
			name: overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
		});
	}

	static primitives(overrides?: Partial<SpeciesPrimitives>): SpeciesPrimitives {
		return {
			attributes: overrides?.attributes ?? {},
			id: overrides?.id ?? faker.string.ulid(),
			name: overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
		};
	}
}
