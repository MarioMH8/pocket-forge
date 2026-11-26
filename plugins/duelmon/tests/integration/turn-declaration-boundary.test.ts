import type { Combat } from '@pocket-forge/combat/domain';
import { DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLUGIN = DuelmonCombatMother.plugin();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const SECOND_PLAYER_MOVE = 'tackle';

function startCombat(): Combat {
	const result = DuelmonCombatStart.fromContent(
		DuelmonCombatStartMother.request(),
		DuelmonCombatStartMother.catalog(),
		DuelmonCombatStartMother.DEFINITIONS
	);

	expect(result.isRight()).toBe(true);

	return result.getRight();
}

describe('Phase 1 turn declaration boundary', () => {
	it('accepts the second known Move of the active combatant without changing the combat', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = PLUGIN.resolve({
			actionBindings: DuelmonCombatMother.useMoveBindings([SECOND_PLAYER_MOVE]),
			combat,
			input: {
				actorId: PLAYER,
				moveId: SECOND_PLAYER_MOVE,
				target: { id: OPPONENT, scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);
		expect(combat.toPrimitives()).toEqual(before);
	});
});
