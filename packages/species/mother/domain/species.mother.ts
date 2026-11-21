import { faker } from '@faker-js/faker';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';
import { Species } from '@pocket-forge/species/domain';

export default class SpeciesMother {
	static create(overrides?: { definitions?: AttributeDefinition[]; id?: string; values?: AttributeValues }): Species {
		const definitions = overrides?.definitions ?? [AttributeDefinitionMother.string()];
		const values =
			overrides?.values ??
			Object.fromEntries(definitions.filter(d => d.required).map(d => [d.key, d.defaultValue!]));

		return Species.create(overrides?.id ?? faker.string.ulid(), values, definitions);
	}

	static fromPrimitives(overrides?: Partial<SpeciesPrimitives>): Species {
		return Species.fromPrimitives({
			attributes: overrides?.attributes ?? {},
			id: overrides?.id ?? faker.string.ulid(),
		});
	}

	static primitives(overrides?: Partial<SpeciesPrimitives>): SpeciesPrimitives {
		return {
			attributes: overrides?.attributes ?? {},
			id: overrides?.id ?? faker.string.ulid(),
		};
	}
}
