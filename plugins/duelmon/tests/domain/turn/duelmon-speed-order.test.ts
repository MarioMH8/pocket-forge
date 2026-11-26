import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity, Combatant as CombatantEntity } from '@pocket-forge/combat/domain';
import type { DuelmonCombatant } from '@pocket-forge/duelmon/domain';
import {
	DuelmonCombat,
	DuelmonCombatant as DuelmonCombatantEntity,
	DuelmonSpeedOrder,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLAYER_ID = 'player-emberling';
const OPPONENT_ID = 'opponent-aquafin';

function activeCombatants(combat: Combat): readonly DuelmonCombatant[] {
	return DuelmonCombat.fromCombat(combat)
		.groups()
		.flatMap(group => group.activeCombatants());
}

function combatant(combat: Combat, id: string): DuelmonCombatant {
	const found = activeCombatants(combat).find(candidate => candidate.id === id);

	if (!found) {
		throw new Error(`Missing active combatant "${id}"`);
	}

	return found;
}

function ids(combatants: readonly DuelmonCombatant[]): readonly string[] {
	return combatants.map(candidate => candidate.id);
}

function orderOf(
	combat: Combat,
	combatants: readonly DuelmonCombatant[] = activeCombatants(combat)
): readonly string[] {
	return ids(DuelmonSpeedOrder.fromCombat(combat).sort(combatants));
}

describe('DuelmonSpeedOrder', () => {
	it('reads Speed from the combatant battle attributes', () => {
		const combat = DuelmonCombatMother.speedOrderCombat();

		expect(combatant(combat, PLAYER_ID).speed).toBe(70);
		expect(combatant(combat, OPPONENT_ID).speed).toBe(48);
	});

	it('puts the faster combatant first regardless of the input order', () => {
		const combat = DuelmonCombatMother.speedOrderCombat();
		const player = combatant(combat, PLAYER_ID);
		const opponent = combatant(combat, OPPONENT_ID);

		expect(orderOf(combat, [opponent, player])).toEqual([PLAYER_ID, OPPONENT_ID]);
		expect(orderOf(combat, [player, opponent])).toEqual([PLAYER_ID, OPPONENT_ID]);
	});

	it('puts the faster opponent first when the player is slower', () => {
		const combat = DuelmonCombatMother.speedOrderCombat({ opponent: { speed: 80 } });

		expect(orderOf(combat)).toEqual([OPPONENT_ID, PLAYER_ID]);
	});

	it('breaks equal speeds by the combatant position in the combat', () => {
		const combat = DuelmonCombatMother.speedOrderCombat({ opponent: { speed: 70 } });
		const player = combatant(combat, PLAYER_ID);
		const opponent = combatant(combat, OPPONENT_ID);

		expect(orderOf(combat, [player, opponent])).toEqual([PLAYER_ID, OPPONENT_ID]);
		expect(orderOf(combat, [opponent, player])).toEqual([PLAYER_ID, OPPONENT_ID]);
	});

	it('follows the group order for equal speeds', () => {
		const combat = DuelmonCombatMother.speedOrderCombat({ opponent: { speed: 70 }, playerFirst: false });
		const player = combatant(combat, PLAYER_ID);
		const opponent = combatant(combat, OPPONENT_ID);

		expect(orderOf(combat, [player, opponent])).toEqual([OPPONENT_ID, PLAYER_ID]);
		expect(orderOf(combat, [opponent, player])).toEqual([OPPONENT_ID, PLAYER_ID]);
	});

	it('ignores speed stages and compares the battle speed attribute', () => {
		const staged = DuelmonCombatMother.speedOrderCombat({
			opponent: { attributes: { speedStage: -6 }, speed: 60 },
			player: { attributes: { speedStage: 6 }, speed: 50 },
		});

		expect(orderOf(staged)).toEqual([OPPONENT_ID, PLAYER_ID]);
	});

	it('ignores paralysis and compares the battle speed attribute', () => {
		const paralyzed = DuelmonCombatMother.speedOrderCombat({
			player: { attributes: { status: 'paralysis' } },
		});

		expect(orderOf(paralyzed)).toEqual([PLAYER_ID, OPPONENT_ID]);
	});

	it('uses the documented tie order even when a combatant is paralyzed', () => {
		const combat = DuelmonCombatMother.speedOrderCombat({
			opponent: { speed: 70 },
			player: { attributes: { status: 'paralysis' } },
		});

		expect(orderOf(combat)).toEqual([PLAYER_ID, OPPONENT_ID]);
	});

	it('compares both directions and identifies the same combatant', () => {
		const combat = DuelmonCombatMother.speedOrderCombat();
		const player = combatant(combat, PLAYER_ID);
		const opponent = combatant(combat, OPPONENT_ID);
		const order = DuelmonSpeedOrder.fromCombat(combat);

		expect(order.compare(player, opponent)).toBeLessThan(0);
		expect(order.compare(opponent, player)).toBeGreaterThan(0);
		expect(order.compare(player, player)).toBe(0);
	});

	it('is reproducible from the same starting point without mutating the state', () => {
		const primitives = DuelmonCombatMother.speedOrderCombat({ opponent: { speed: 70 } }).toPrimitives();
		const first = CombatEntity.fromPrimitives(structuredClone(primitives));
		const second = CombatEntity.fromPrimitives(structuredClone(primitives));
		const before = first.toPrimitives();
		const input = activeCombatants(first);
		const inputIds = ids(input);
		const expected = orderOf(first, input);

		expect(expected).toEqual([PLAYER_ID, OPPONENT_ID]);
		expect(orderOf(second)).toEqual(expected);
		expect(orderOf(first, input.toReversed())).toEqual(expected);
		expect(ids(input)).toEqual(inputIds);
		expect(first.toPrimitives()).toEqual(before);
	});

	it('rejects a combatant from another combat', () => {
		const combat = DuelmonCombatMother.speedOrderCombat();
		const intruder = DuelmonCombatantEntity.fromCombatant(
			CombatantEntity.fromPrimitives(
				DuelmonCombatMother.combatant('intruder', 'player', 'emberling', {
					attack: 57,
					defense: 48,
					hp: 99,
					level: 50,
					maxHp: 99,
					special: 65,
					speed: 70,
				})
			)
		);

		expect(() => DuelmonSpeedOrder.fromCombat(combat).sort([combatant(combat, PLAYER_ID), intruder])).toThrow(
			'does not belong to the combat'
		);
	});
});
