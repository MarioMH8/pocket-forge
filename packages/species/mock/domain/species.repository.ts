import type { Species } from '@pocket-forge/species/domain';
import { vi } from 'bun:test';

export default class MockSpeciesRepository {
	findAll = vi.fn<() => Species[]>();
	findById = vi.fn<(id: string) => Species | undefined>();
}
