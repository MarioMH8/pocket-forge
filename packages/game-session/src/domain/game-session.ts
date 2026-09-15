import AggregateRoot from '@hexadrop/aggregate-root';
import type { Primitives } from '@hexadrop/types/primitives';

import { GameSessionCreatedEvent, GameSessionDeletedEvent } from './event';
import GameSessionId from './game-session-id';

export default class GameSession extends AggregateRoot {
	readonly id: GameSessionId;

	private constructor(primitives: Primitives<GameSession>) {
		super();
		const { id } = primitives;
		this.id = new GameSessionId(id);
	}

	static create(primitives: Primitives<GameSession>): GameSession {
		const session = new GameSession(primitives);
		session.record(new GameSessionCreatedEvent(session.id.value));

		return session;
	}

	static delete(session: GameSession): GameSession {
		session.record(new GameSessionDeletedEvent(session.id.value));

		return session;
	}

	static fromPrimitives(primitives: Primitives<GameSession>): GameSession {
		return new GameSession(primitives);
	}

	override toPrimitives(): Primitives<GameSession> {
		return {
			id: this.id.value,
		};
	}
}
