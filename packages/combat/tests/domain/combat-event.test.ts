import type { CombatEvent, CombatOutcome } from '@pocket-forge/combat/domain';
import { describe, expect, it } from 'bun:test';

describe('CombatEvent', () => {
	it('carries a serializable payload', () => {
		const event: CombatEvent = {
			payload: { amount: 5, critical: false, tags: ['fire', 'contact'] },
			sequence: 1,
			type: 'damage-dealt',
		};

		expect(structuredClone(event)).toEqual(event);
	});
});

describe('CombatOutcome', () => {
	it('discriminates victory from draw', () => {
		const victory: CombatOutcome = { status: 'victory', winnerGroupId: 'group-1' };
		const draw: CombatOutcome = { status: 'draw' };

		expect(victory.status).toBe('victory');
		expect(draw.status).toBe('draw');
	});
});
