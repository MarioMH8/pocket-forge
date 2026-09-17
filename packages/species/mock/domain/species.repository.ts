import { vi } from 'bun:test';

import type Species from '../../src/domain/species';

export default class MockSpeciesRepository {
	findAll = vi.fn<() => Species[]>();
	findById = vi.fn<(id: string) => Species | undefined>();
}
