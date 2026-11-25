import { DuelmonCombatHistory, DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function history(): DuelmonCombatHistory {
	return DuelmonCombatHistory.start(DuelmonCombatStartMother.combat());
}

describe('DuelmonCombatHistory', () => {
	it('records the start as its first entry', () => {
		const entries = history().entries();

		expect(entries).toHaveLength(1);
		expect(entries[0]?.kind).toBe('start');
	});

	it('exposes a frozen entry list', () => {
		expect(Object.isFrozen(history().entries())).toBe(true);
	});

	it('serializes and hydrates the same entries', () => {
		const primitives = history().toPrimitives();

		expect(DuelmonCombatHistory.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('keeps every persisted entry in order', () => {
		const primitives = history().toPrimitives();
		const first = primitives.entries[0];

		if (!first) {
			throw new Error('Missing start entry');
		}

		const duplicated = { entries: [first, first] };
		const hydrated = DuelmonCombatHistory.fromPrimitives(duplicated);

		expect(hydrated.entries()).toHaveLength(2);
		expect(hydrated.toPrimitives()).toEqual(duplicated);
	});

	it('is deterministic for the same combat', () => {
		expect(history().toPrimitives()).toEqual(history().toPrimitives());
	});

	it('records the start from the same combat the start contract returns', () => {
		const combat = DuelmonCombatStart.fromContent(
			DuelmonCombatStartMother.request(),
			DuelmonCombatStartMother.catalog(),
			DuelmonCombatStartMother.DEFINITIONS
		).getRight();

		const entry = DuelmonCombatHistory.start(combat).entries()[0];

		expect(entry?.combat).toEqual(combat.toPrimitives());
		expect(entry?.text).toContain('player-emberling (emberling) [Fire] HP 99/99');
	});
});
