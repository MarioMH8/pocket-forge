import { vi } from 'bun:test';

import type Ability from '../../src/domain/ability';

export default class MockAbilityRepository {
	findAll = vi.fn<() => Ability[]>();
	findById = vi.fn<(id: string) => Ability | undefined>();
}
