import type { Move } from '@pocket-forge/moves/domain';
import { vi } from 'bun:test';

export default class MockMoveRepository {
	findAll = vi.fn<() => Move[]>();
	findById = vi.fn<(id: string) => Move | undefined>();
}
