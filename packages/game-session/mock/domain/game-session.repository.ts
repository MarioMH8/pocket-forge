import Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import { vi } from 'bun:test';

import type GameSession from '../../src/domain/game-session';
import type GameSessionId from '../../src/domain/game-session-id';
import GameSessionRepository from '../../src/domain/repository';

export default class MockGameSessionRepository extends GameSessionRepository {
	findById = vi.fn<(id: GameSessionId) => Promise<Either<DomainError, GameSession>>>();

	remove = vi.fn<(id: GameSessionId) => Promise<Either<DomainError, void>>>();

	upsert = vi.fn<(session: GameSession) => Promise<Either<DomainError, void>>>();
}
