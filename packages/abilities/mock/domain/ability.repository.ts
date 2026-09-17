import type { Ability } from '@pocket-forge/abilities/domain';
import { vi } from 'bun:test';

export default class MockAbilityRepository {
	findAll = vi.fn<() => Ability[]>();
	findById = vi.fn<(id: string) => Ability | undefined>();
}
