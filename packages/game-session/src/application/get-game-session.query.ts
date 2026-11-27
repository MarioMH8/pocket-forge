import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import Query from '@hexadrop/query';
import type { QueryHandler as QueryHandlerInterface } from '@hexadrop/query/bus';
import QueryHandler from '@hexadrop/query/decorator';
import type { GameSessionRepository } from '@pocket-forge/game-session/domain';
import { GameSession, GameSessionId } from '@pocket-forge/game-session/domain';

interface GetGameSessionQueryConstructorParameters {
	id: string;
}

/**
 * Read-side query to retrieve a {@link GameSession} by its ULID.
 *
 * @example
 * ```ts
 * const query = new GetGameSessionQuery({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
 * ```
 */
class GetGameSessionQuery extends Query<GameSession> {
	static override QUERY_NAME = 'GetGameSessionQuery';

	/**
	 *The ULID of the session to fetch.
	 */
	readonly id: string;

	constructor({ id }: GetGameSessionQueryConstructorParameters) {
		super(GetGameSessionQuery.QUERY_NAME);
		this.id = id;
	}

	override get response(): new (...arguments_: unknown[]) => GameSession {
		return GameSession as unknown as new (...arguments_: unknown[]) => GameSession;
	}
}

/**
 * Handles {@link GetGameSessionQuery} by delegating to the repository.
 *
 * @throws Never throws — errors are returned as left-side {@link Either} values.
 */
@QueryHandler(GetGameSessionQuery)
class GetGameSessionQueryHandler implements QueryHandlerInterface<GameSession, GetGameSessionQuery> {
	constructor(private readonly repository: GameSessionRepository) {}

	async run(query: GetGameSessionQuery): Promise<Either<DomainError, GameSession>> {
		const id = new GameSessionId(query.id);

		return this.repository.findById(id);
	}
}

export { GetGameSessionQuery, GetGameSessionQueryHandler };
