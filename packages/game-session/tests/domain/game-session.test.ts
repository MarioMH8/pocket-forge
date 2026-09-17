import { describe, expect, it } from 'bun:test';

import GameSessionMother from '../../mother/domain/game-session.mother';
import GameSession from '../../src/domain/game-session';

describe('GameSession', () => {
	describe('create', () => {
		it('returns a GameSession with the given id', () => {
			const session = GameSessionMother.create({ id: '01JQ5X8Y9Z0A1B2C3D4E5F6G7H' });

			expect(session.id.value).toBe('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');
		});

		it('records a GameSessionCreatedEvent', () => {
			const session = GameSessionMother.create();

			const events = session.pullDomainEvents();

			expect(events).toHaveLength(1);
			expect(events[0]?.eventName).toBe('GameSession.created');
			expect(events[0]?.aggregateId).toBe(session.id.value);
		});
	});

	describe('delete', () => {
		it('records a GameSessionDeletedEvent on the session', () => {
			const session = GameSessionMother.fromPrimitives();

			GameSession.delete(session);
			const events = session.pullDomainEvents();

			expect(events).toHaveLength(1);
			expect(events[0]?.eventName).toBe('GameSession.deleted');
			expect(events[0]?.aggregateId).toBe(session.id.value);
		});
	});

	describe('fromPrimitives', () => {
		it('returns a GameSession without recording any events', () => {
			const session = GameSessionMother.fromPrimitives({ id: '01JQ5X8Y9Z0A1B2C3D4E5F6G7H' });

			expect(session.id.value).toBe('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');
			expect(session.pullDomainEvents()).toHaveLength(0);
		});
	});

	describe('toPrimitives', () => {
		it('returns a plain object with the session id', () => {
			const session = GameSessionMother.fromPrimitives({ id: '01JQ5X8Y9Z0A1B2C3D4E5F6G7H' });

			expect(session.toPrimitives()).toEqual({ id: '01JQ5X8Y9Z0A1B2C3D4E5F6G7H' });
		});
	});
});
