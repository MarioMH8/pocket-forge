import { DuelmonCombat } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

class CombatFixture {
	static combat(): DuelmonCombat {
		return DuelmonCombat.fromCombat(DuelmonCombatStartMother.combat());
	}
}

describe('DuelmonCombat', () => {
	it('exposes the combat id and its groups in order', () => {
		expect(CombatFixture.combat().id).toBe('combat-1');
		expect(
			CombatFixture.combat()
				.groups()
				.map(group => group.id)
		).toEqual(['player', 'opponent']);
	});

	it('finds a group by id', () => {
		expect(CombatFixture.combat().group('player')?.id).toBe('player');
		expect(CombatFixture.combat().group('opponent')?.id).toBe('opponent');
		expect(CombatFixture.combat().group('missing')).toBeUndefined();
	});

	it('wraps the combatants of every group', () => {
		const duelmonCombat = CombatFixture.combat();

		expect(
			duelmonCombat
				.group('player')
				?.combatants()
				.map(combatant => combatant.id)
		).toEqual(['player-emberling']);
		expect(
			duelmonCombat
				.group('opponent')
				?.combatants()
				.map(combatant => combatant.id)
		).toEqual(['opponent-aquafin']);
	});
});
