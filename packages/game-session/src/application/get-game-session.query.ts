import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import Query from '@hexadrop/query';
import type { QueryHandler as QueryHandlerInterface } from '@hexadrop/query/bus';
import QueryHandler from '@hexadrop/query/decorator';

import GameSession from '../domain/game-session';
import GameSessionId from '../domain/game-session-id';
import type GameSessionRepository from '../domain/repository';

interface GetGameSessionQueryConstructorParameters {
	id: string;
}

class GetGameSessionQuery extends Query<GameSession> {
	static override QUERY_NAME = 'GetGameSessionQuery';

	readonly id: string;

	constructor({ id }: GetGameSessionQueryConstructorParameters) {
		super(GetGameSessionQuery.QUERY_NAME);
		this.id = id;
	}

	override get response(): new (...arguments_: unknown[]) => GameSession {
		return GameSession as unknown as new (...arguments_: unknown[]) => GameSession;
	}
}

@QueryHandler(GetGameSessionQuery)
class GetGameSessionQueryHandler implements QueryHandlerInterface<GameSession, GetGameSessionQuery> {
	constructor(private readonly repository: GameSessionRepository) {}

	async run(query: GetGameSessionQuery): Promise<Either<DomainError, GameSession>> {
		const id = new GameSessionId(query.id);

		return this.repository.findById(id);
	}
}

export { GetGameSessionQuery, GetGameSessionQueryHandler };
