import type { CombatEvent, KnownCombatEvent } from '@pocket-forge/combat-engine/domain';
import { COMBAT_EVENT_TYPES, CombatEvents, CombatOutcome } from '@pocket-forge/combat-engine/domain';
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

describe('CombatEvents', () => {
	it('builds a known victory event', () => {
		const event: KnownCombatEvent = CombatEvents.completed(CombatOutcome.victory('group-1'), 2);

		expect(event).toEqual({
			payload: { status: 'victory', winnerGroupId: 'group-1' },
			sequence: 2,
			type: COMBAT_EVENT_TYPES.combatCompleted,
		});
	});
});

describe('CombatOutcome', () => {
	it('discriminates victory from draw', () => {
		const victory = CombatOutcome.victory('group-1');
		const draw = CombatOutcome.draw();

		expect(victory.status).toBe('victory');
		expect(draw.status).toBe('draw');
	});
});
