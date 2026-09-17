import type { Creature } from '@pocket-forge/creature/domain';
import { vi } from 'bun:test';

export default class MockCreatureRepository {
	findAll = vi.fn<() => Creature[]>();
	findById = vi.fn<(id: string) => Creature | undefined>();
	save = vi.fn<(creature: Creature) => void>();
}
