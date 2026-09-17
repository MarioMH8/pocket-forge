import { describe, expect, it } from 'bun:test';

import { GameSessionCreatedEvent } from '../../../src/domain';

describe('GameSessionCreatedEvent', () => {
	it('has EVENT_NAME "GameSession.created"', () => {
		expect(GameSessionCreatedEvent.EVENT_NAME).toBe('GameSession.created');
	});

	it('sets aggregateId and eventName on construction', () => {
		const event = new GameSessionCreatedEvent('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');

		expect(event.eventName).toBe('GameSession.created');
		expect(event.aggregateId).toBe('01JQ5X8Y9Z0A1B2C3D4E5F6G7H');
	});
});
