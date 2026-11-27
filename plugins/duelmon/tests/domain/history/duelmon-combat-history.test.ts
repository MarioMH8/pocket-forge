import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { CombatResolution } from '@pocket-forge/combat-engine/domain';
import {
	DuelmonCombatHistory,
	DuelmonCombatStart,
	DuelmonCombatTurnAction,
	DuelmonCombatTurnResult,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';

function combatWithHp(playerHp: number, opponentHp: number): Combat {
	const primitives: CombatPrimitives = DuelmonCombatStartMother.primitives();
	const player = primitives.groups.find(group => group.id === 'player')?.combatants[0];
	const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

	if (!player || !opponent) {
		throw new Error('Start fixture is missing a combatant');
	}

	player.attributes['hp'] = playerHp;
	opponent.attributes['hp'] = opponentHp;

	return CombatEntity.fromPrimitives(primitives);
}

function turnResult(): DuelmonCombatTurnResult {
	const first = combatWithHp(99, 84);
	const second = combatWithHp(94, 84);

	return DuelmonCombatTurnResult.create(CombatResolution.create(second, []), [
		DuelmonCombatTurnAction.create(PLAYER, 'ember-burst', OPPONENT, first, 70, false),
		DuelmonCombatTurnAction.create(OPPONENT, 'aqua-burst', PLAYER, second, 48, false),
	]);
}

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

	it('appends one action entry per resolved action in the turn order', () => {
		const result = turnResult();
		const recorded = history().recordTurn(result);

		expect(recorded.entries().map(entry => entry.kind)).toEqual(['start', 'action', 'action']);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.actorId)
		).toEqual([PLAYER, OPPONENT]);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.moveId)
		).toEqual(['ember-burst', 'aqua-burst']);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.targetId)
		).toEqual([OPPONENT, PLAYER]);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.speed)
		).toEqual([70, 48]);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.tieBreak)
		).toEqual([false, false]);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.combat)
		).toEqual(result.actions.map(action => action.combat.toPrimitives()));
	});

	it('does not mutate the previous history', () => {
		const previous = history();
		const before = previous.toPrimitives();
		const recorded = previous.recordTurn(turnResult());

		expect(recorded).not.toBe(previous);
		expect(previous.entries()).toHaveLength(1);
		expect(previous.toPrimitives()).toEqual(before);
		expect(recorded.entries()).toHaveLength(3);
	});

	it('adds no entry for a turn without resolved actions', () => {
		const previous = history();
		const empty = DuelmonCombatTurnResult.create(CombatResolution.create(combatWithHp(99, 104), []), []);

		expect(previous.recordTurn(empty).toPrimitives()).toEqual(previous.toPrimitives());
	});

	it('round-trips recorded action entries through primitives', () => {
		const primitives = history().recordTurn(turnResult()).toPrimitives();

		expect(primitives.entries.map(entry => entry.kind)).toEqual(['start', 'action', 'action']);
		expect(DuelmonCombatHistory.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('is deterministic for the same start and turn', () => {
		expect(history().recordTurn(turnResult()).toPrimitives()).toEqual(
			history().recordTurn(turnResult()).toPrimitives()
		);
	});
});
