import Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import type { GameSession, GameSessionId } from '@pocket-forge/game-session/domain';
import { GameSessionRepository } from '@pocket-forge/game-session/domain';
import { vi } from 'bun:test';

export default class MockGameSessionRepository extends GameSessionRepository {
	findById = vi.fn<(id: GameSessionId) => Promise<Either<DomainError, GameSession>>>();

	remove = vi.fn<(id: GameSessionId) => Promise<Either<DomainError, void>>>();

	upsert = vi.fn<(session: GameSession) => Promise<Either<DomainError, void>>>();
}
