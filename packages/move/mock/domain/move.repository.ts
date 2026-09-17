import { vi } from 'bun:test';

import type Move from '../../src/domain/move';

export default class MockMoveRepository {
	findAll = vi.fn<() => Move[]>();
	findById = vi.fn<(id: string) => Move | undefined>();
}
