import { faker } from '@faker-js/faker';
import type { Primitives } from '@hexadrop/types/primitives';
import { AttributeAssignment, AttributeDefinition } from '@pocket-forge/attribute/domain';

import AttributeDefinitionMother from './attribute-definition.mother';

export default class AttributeAssignmentMother {
	static readonly DEFAULT_DEFINITION_ID = 'default-attr';
	static readonly DEFAULT_VALUE = 'default-value';

	static create(
		definition?: AttributeDefinition,
		overrides?: Partial<Primitives<AttributeAssignment>>
	): AttributeAssignment {
		const resolved = definition ?? AttributeDefinitionMother.string();

		return AttributeAssignment.create(
			{
				key: overrides?.key ?? resolved.key,
				value: overrides?.value ?? resolved.defaultValue,
			},
			resolved
		);
	}

	static fromPrimitives(overrides?: Partial<Primitives<AttributeAssignment>>): AttributeAssignment {
		return AttributeAssignment.fromPrimitives({
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			value: overrides?.value ?? faker.string.alpha(10),
		});
	}
}
