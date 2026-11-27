import { CombatantGroup } from '@pocket-forge/combat/domain';
import { DuelmonCombatantGroup } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function group(index = 0): DuelmonCombatantGroup {
	const entry = DuelmonCombatStartMother.combat().groups[index];

	if (!entry) {
		throw new Error(`Missing fixture group at index ${String(index)}`);
	}

	return DuelmonCombatantGroup.fromGroup(entry);
}

describe('DuelmonCombatantGroup', () => {
	it('exposes the group id and its active subset', () => {
		const view = group();

		expect(view.id).toBe('player');
		expect(view.activeCombatantIds).toEqual(['player-emberling']);
		expect(view.activeCombatants().map(combatant => combatant.id)).toEqual(['player-emberling']);
	});

	it('exposes every combatant in order', () => {
		expect(
			group()
				.combatants()
				.map(combatant => combatant.id)
		).toEqual(['player-emberling']);
		expect(
			group(1)
				.combatants()
				.map(combatant => combatant.id)
		).toEqual(['opponent-aquafin']);
	});

	it('finds a combatant by id', () => {
		expect(group().combatant('player-emberling')?.id).toBe('player-emberling');
		expect(group().combatant('missing')).toBeUndefined();
	});

	it('throws when the active subset is missing', () => {
		const primitives = DuelmonCombatStartMother.primitives();
		const first = primitives.groups[0];

		if (!first) {
			throw new Error('Missing fixture group');
		}

		const view = DuelmonCombatantGroup.fromGroup(CombatantGroup.fromPrimitives({ ...first, attributes: {} }));

		expect(() => view.activeCombatantIds).toThrow();
	});
});
