import { faker } from '@faker-js/faker';
import type { AttributeAssignment, AttributeDefinition } from '@pocket-forge/attributes/domain';
import { AttributeAssignmentMother, AttributeDefinitionMother } from '@pocket-forge/attributes/mother/domain';
import type { SpeciesPrimitives } from '@pocket-forge/species/domain';
import { Species } from '@pocket-forge/species/domain';

export default class SpeciesMother {
	static create(overrides?: {
		assignments?: AttributeAssignment[];
		definitions?: AttributeDefinition[];
		description?: string;
		id?: string;
		name?: string;
	}): Species {
		const definitions = overrides?.definitions ?? [AttributeDefinitionMother.string()];
		const assignments = overrides?.assignments ?? definitions.map(d => AttributeAssignmentMother.default(d));

		return Species.create(
			overrides?.id ?? faker.string.ulid(),
			overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			overrides?.description ?? faker.lorem.sentence(),
			assignments,
			definitions
		);
	}

	static fromPrimitives(overrides?: Partial<SpeciesPrimitives>): Species {
		return Species.fromPrimitives({
			attributes: overrides?.attributes ?? {},
			description: overrides?.description ?? faker.lorem.sentence(),
			id: overrides?.id ?? faker.string.ulid(),
			name: overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
		});
	}

	static primitives(overrides?: Partial<SpeciesPrimitives>): SpeciesPrimitives {
		return {
			attributes: overrides?.attributes ?? {},
			description: overrides?.description ?? faker.lorem.sentence(),
			id: overrides?.id ?? faker.string.ulid(),
			name: overrides?.name ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
		};
	}
}
