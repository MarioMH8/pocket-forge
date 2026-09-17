import { vi } from 'bun:test';

import type Creature from '../../src/domain/creature';

export default class MockCreatureRepository {
	findAll = vi.fn<() => Creature[]>();
	findById = vi.fn<(id: string) => Creature | undefined>();
	save = vi.fn<(creature: Creature) => void>();
}
