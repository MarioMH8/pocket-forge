import { faker } from '@faker-js/faker';

import AttributeAssignment from '../../src/domain/attribute-assignment';
import AttributeDefinition from '../../src/domain/attribute-definition';
import type { AttributeAssignmentPrimitives } from '../../src/domain/attribute-types';
import AttributeDefinitionMother from './attribute-definition.mother';

export default class AttributeAssignmentMother {
	static readonly DEFAULT_DEFINITION_ID = 'default-attr';
	static readonly DEFAULT_VALUE = 'default-value';

	static create(
		definition?: AttributeDefinition,
		overrides?: Partial<AttributeAssignmentPrimitives>
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

	static default(definition: AttributeDefinition): AttributeAssignment {
		return AttributeAssignment.default(definition);
	}

	static fromPrimitives(overrides?: Partial<AttributeAssignmentPrimitives>): AttributeAssignment {
		return AttributeAssignment.fromPrimitives({
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			value: overrides?.value ?? faker.string.alpha(10),
		});
	}
}
