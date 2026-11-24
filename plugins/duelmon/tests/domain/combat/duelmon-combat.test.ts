import { DuelmonCombat } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function view(): DuelmonCombat {
	return DuelmonCombat.fromCombat(DuelmonCombatStartMother.combat());
}

describe('DuelmonCombat', () => {
	it('exposes the combat id and its groups in order', () => {
		expect(view().id).toBe('combat-1');
		expect(
			view()
				.groups()
				.map(group => group.id)
		).toEqual(['player', 'opponent']);
	});

	it('finds a group by id', () => {
		expect(view().group('player')?.id).toBe('player');
		expect(view().group('opponent')?.id).toBe('opponent');
		expect(view().group('missing')).toBeUndefined();
	});

	it('wraps the combatants of every group', () => {
		const combatView = view();

		expect(
			combatView
				.group('player')
				?.combatants()
				.map(combatant => combatant.id)
		).toEqual(['player-emberling']);
		expect(
			combatView
				.group('opponent')
				?.combatants()
				.map(combatant => combatant.id)
		).toEqual(['opponent-aquafin']);
	});
});
