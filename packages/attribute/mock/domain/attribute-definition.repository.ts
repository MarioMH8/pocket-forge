import { vi } from 'bun:test';

import type AttributeDefinition from '../../src/domain/attribute-definition';

export default class MockAttributeDefinitionRepository {
	findAll = vi.fn<() => AttributeDefinition[]>();
	findByKey = vi.fn<(key: string) => AttributeDefinition | undefined>();
}
