import type { AttributeDefinition } from '@pocket-forge/attributes/domain';
import { vi } from 'bun:test';

export default class MockAttributeDefinitionRepository {
	findAll = vi.fn<() => AttributeDefinition[]>();
	findByKey = vi.fn<(key: string) => AttributeDefinition | undefined>();
}
