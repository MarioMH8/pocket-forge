import AggregateRoot from '@hexadrop/aggregate-root';
import type { Primitives } from '@hexadrop/types/primitives';

import { GameSessionCreatedEvent, GameSessionDeletedEvent } from './event';
import GameSessionId from './game-session-id';

/**
 * Aggregate root representing a player's game session.
 *
 * A GameSession is the top-level boundary for all gameplay state within a single
 * play-through. It owns its identity via a {@link GameSessionId} and emits
 * domain events on creation and deletion so that subscribers can react
 * (e.g. initialising creature rosters or cleaning up resources).
 *
 * @example
 * ```ts
 * // Creating a new session
 * const session = GameSession.create({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
 * const events = session.pullDomainEvents();
 * // events[0] is a GameSessionCreatedEvent
 *
 * // Deleting an existing session
 * const deleted = GameSession.delete(session);
 * const deletionEvents = deleted.pullDomainEvents();
 * // deletionEvents[0] is a GameSessionDeletedEvent
 * ```
 */
export default class GameSession extends AggregateRoot {
	/**
	 *Unique identifier for this session, backed by a ULID.
	 */
	readonly id: GameSessionId;

	private constructor(primitives: Primitives<GameSession>) {
		super();
		const { id } = primitives;
		this.id = new GameSessionId(id);
	}

	/**
	 * Creates a new game session and records a {@link GameSessionCreatedEvent}.
	 *
	 * @param primitives - Plain object with an `id` field (a valid ULID string).
	 * @returns A new GameSession aggregate with a pending creation event.
	 */
	static create(primitives: Primitives<GameSession>): GameSession {
		const session = new GameSession(primitives);
		session.record(new GameSessionCreatedEvent(session.id.value));

		return session;
	}

	/**
	 * Marks an existing session as deleted by recording a {@link GameSessionDeletedEvent}.
	 *
	 * The caller is responsible for persisting the deletion (e.g. via a repository)
	 * and publishing the pulled events afterwards.
	 *
	 * @param session - The session to mark for deletion.
	 * @returns The same session instance with a pending deletion event.
	 */
	static delete(session: GameSession): GameSession {
		session.record(new GameSessionDeletedEvent(session.id.value));

		return session;
	}

	/**
	 * Hydrates a GameSession from a plain object without side effects.
	 * Intended for persistence read-models — no domain events are recorded.
	 *
	 * @param primitives - Plain object with an `id` field.
	 * @returns A rehydrated GameSession aggregate.
	 */
	static fromPrimitives(primitives: Primitives<GameSession>): GameSession {
		return new GameSession(primitives);
	}

	override toPrimitives(): Primitives<GameSession> {
		return {
			id: this.id.value,
		};
	}
}
