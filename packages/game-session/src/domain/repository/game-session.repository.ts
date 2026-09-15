import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';

import type GameSession from '../game-session';
import type GameSessionId from '../game-session-id';

export default abstract class GameSessionRepository {
	abstract findById(id: GameSessionId): Promise<Either<DomainError, GameSession>>;

	abstract remove(id: GameSessionId): Promise<Either<DomainError, void>>;

	abstract upsert(session: GameSession): Promise<Either<DomainError, void>>;
}
