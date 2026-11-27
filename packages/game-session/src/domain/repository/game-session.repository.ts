import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';

import type GameSession from '../game-session';
import type GameSessionId from '../game-session-id';

/**
 * Persistence contract for {@link GameSession} aggregates.
 *
 * Implementations must provide concrete storage (in-memory, database, etc.)
 * and return {@link Either} results so callers can handle failures without
 * relying on try/catch.
 */
export default abstract class GameSessionRepository {
	/**
	 * Looks up a session by its unique identifier.
	 *
	 * @param id - The {@link GameSessionId} to search for.
	 * @returns A right-biased {@link Either} containing the session on success,
	 *          or a {@link DomainError} on the left if not found.
	 */
	abstract findById(id: GameSessionId): Promise<Either<DomainError, GameSession>>;

	/**
	 * Deletes a session from the underlying store.
	 *
	 * @param id - The {@link GameSessionId} of the session to remove.
	 * @returns A right-biased {@link Either} with `void` on success,
	 *          or a {@link DomainError} on the left if the operation fails.
	 */
	abstract remove(id: GameSessionId): Promise<Either<DomainError, void>>;

	/**
	 * Inserts or updates a session in the underlying store.
	 *
	 * @param session - The {@link GameSession} aggregate to persist.
	 * @returns A right-biased {@link Either} with `void` on success,
	 *          or a {@link DomainError} on the left if the operation fails.
	 */
	abstract upsert(session: GameSession): Promise<Either<DomainError, void>>;
}
