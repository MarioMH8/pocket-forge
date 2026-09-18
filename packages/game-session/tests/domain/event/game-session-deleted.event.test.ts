import { GameSessionDeletedEvent } from '@pocket-forge/game-session/domain';
import { describe, expect, it } from 'bun:test';

describe('GameSessionDeletedEvent', () => {
	it('has EVENT_NAME "GameSession.deleted"', () => {
		expect(GameSessionDeletedEvent.EVENT_NAME).toBe('GameSession.deleted');
	});

	it('sets aggregateId and eventName on construction', () => {
		const event = new GameSessionDeletedEvent('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');

		expect(event.eventName).toBe('GameSession.deleted');
		expect(event.aggregateId).toBe('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');
	});
});
