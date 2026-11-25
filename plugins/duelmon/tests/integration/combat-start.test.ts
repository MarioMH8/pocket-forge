import type { DuelmonCombatantGroup, DuelmonCombatStartRequest } from '@pocket-forge/duelmon/domain';
import {
	DuelmonCombat,
	DuelmonCombatHistory,
	DuelmonCombatReport,
	DuelmonCombatStart,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

type DeepMutable<T> = T extends readonly (infer U)[]
	? DeepMutable<U>[]
	: T extends object
		? { -readonly [K in keyof T]: DeepMutable<T[K]> }
		: T;

type MutableRequest = DeepMutable<DuelmonCombatStartRequest>;

const PHASE_1_ATTRIBUTE_KEYS = ['attack', 'defense', 'hp', 'level', 'maxHp', 'special', 'speed'];

function valid(): MutableRequest {
	return structuredClone(DuelmonCombatStartMother.request()) as MutableRequest;
}

function start(request: DuelmonCombatStartRequest = DuelmonCombatStartMother.request()) {
	return DuelmonCombatStart.fromContent(
		request,
		DuelmonCombatStartMother.catalog(),
		DuelmonCombatStartMother.DEFINITIONS
	);
}

function startCombat() {
	const result = start();

	expect(result.isRight()).toBe(true);

	return result.getRight();
}

function started() {
	return DuelmonCombat.fromCombat(startCombat());
}

function group(request: MutableRequest, index: number) {
	const value = request.groups[index];

	if (!value) {
		throw new Error(`Missing group at index ${String(index)}`);
	}

	return value;
}

function combatant(request: MutableRequest, groupIndex: number, combatantIndex = 0) {
	const value = group(request, groupIndex).combatants[combatantIndex];

	if (!value) {
		throw new Error(`Missing combatant at index ${String(combatantIndex)}`);
	}

	return value;
}

function requireGroup(combat: DuelmonCombat, id: string): DuelmonCombatantGroup {
	const value = combat.group(id);

	if (!value) {
		throw new Error(`Missing combat group "${id}"`);
	}

	return value;
}

function requireActiveCombatant(combatantGroup: DuelmonCombatantGroup) {
	const [value] = combatantGroup.activeCombatants();

	if (!value) {
		throw new Error(`Group "${combatantGroup.id}" has no active combatant`);
	}

	return value;
}

describe('Phase 1 combat start product scenarios', () => {
	it('starts a valid one-on-one combat with two minimum-set creatures', () => {
		const combat = started();

		expect(combat.id).toBe('combat-1');
		expect(combat.groups().map(combatGroup => combatGroup.id)).toEqual(['player', 'opponent']);

		const player = requireGroup(combat, 'player');
		const opponent = requireGroup(combat, 'opponent');
		const playerCombatant = requireActiveCombatant(player);
		const opponentCombatant = requireActiveCombatant(opponent);

		expect(player.activeCombatantIds).toEqual(['player-emberling']);
		expect(opponent.activeCombatantIds).toEqual(['opponent-aquafin']);

		expect(playerCombatant.id).toBe('player-emberling');
		expect(playerCombatant.species().id).toBe('emberling');
		expect(playerCombatant.species().types).toEqual(['Fire']);
		expect([playerCombatant.hp, playerCombatant.maxHp]).toEqual([99, 99]);
		expect(playerCombatant.moves().map(move => move.id)).toEqual(['ember-burst', 'tackle']);

		expect(opponentCombatant.id).toBe('opponent-aquafin');
		expect(opponentCombatant.species().id).toBe('aquafin');
		expect(opponentCombatant.species().types).toEqual(['Water']);
		expect([opponentCombatant.hp, opponentCombatant.maxHp]).toEqual([104, 104]);
		expect(opponentCombatant.moves().map(move => move.id)).toEqual(['aqua-burst', 'tackle']);
	});

	it('renders the started state as readable text', () => {
		const text = DuelmonCombatReport.fromCombat(startCombat()).toString();

		expect(text).toContain('player-emberling (emberling) [Fire] HP 99/99');
		expect(text).toContain('opponent-aquafin (aquafin) [Water] HP 104/104');
		expect(text).toContain('ember-burst (Fire / Special / 40 power)');
		expect(text).toContain('aqua-burst (Water / Special / 40 power)');
		expect(text).toContain('tackle (Normal / Physical / 35 power)');
	});

	it('rejects incomplete content with a clear message and no combat', () => {
		const request = valid();

		combatant(request, 0).moveIds = ['ember-burst', 'missing'];

		const result = start(request);

		expect(result.isLeft()).toBe(true);

		const [error] = result.getLeft();

		expect(error?.reason).toBe('unknown-move');
		expect(error?.path).toBe('groups.0.combatants.0.creature.moves.1');
		expect(error?.message).toContain('Unknown move "missing"');
	});

	it('rejects a loadout without moves', () => {
		const request = valid();

		combatant(request, 0).moveIds = [];

		const result = start(request);

		expect(result.isLeft()).toBe(true);

		const [error] = result.getLeft();

		expect(error?.reason).toBe('missing-moves');
		expect(error?.path).toBe('groups.0.combatants.0.creature.moves');
		expect(error?.message).toContain('at least one move');
	});

	it('rejects out-of-phase content without a partial combat', () => {
		for (const [moveId, unsupported] of [
			['oath', 'Status move'],
			['flare', 'secondary effect'],
			['quick-jab', 'priority'],
		] as const) {
			const request = valid();

			combatant(request, 0).moveIds = [moveId];

			const result = start(request);

			expect(result.isLeft()).toBe(true);

			const [error] = result.getLeft();

			expect(error?.reason).toBe('unsupported-move');
			expect(error?.path).toBe('groups.0.combatants.0.creature.moves.0');
			expect(error?.message).toContain(moveId);
			expect(error?.message).toContain(unsupported);
			expect(error?.message).toContain('outside Phase 1');
		}
	});

	it('exposes only the Phase 1 state surface', () => {
		const combat = started();
		const combatants = combat.groups().flatMap(combatGroup => combatGroup.combatants());

		expect(combatants).toHaveLength(2);

		for (const combatantView of combatants) {
			expect(Object.keys(combatantView.attributes).toSorted((left, right) => left.localeCompare(right))).toEqual(
				PHASE_1_ATTRIBUTE_KEYS
			);
			expect('status' in combatantView.attributes).toBe(false);
			expect('movePp' in combatantView.attributes).toBe(false);

			for (const move of combatantView.moves()) {
				expect(move.isStatus).toBe(false);
				expect(move.hasPrimaryStatus).toBe(false);
				expect(move.hasVolatileStatus).toBe(false);
				expect(move.hasSecondaryEffect).toBe(false);
				expect(move.changesStages).toBe(false);
				expect(move.drains).toBe(false);
				expect(move.recoils).toBe(false);
				expect(move.isMultiHit).toBe(false);
				expect(move.hasHighCritRatio).toBe(false);
				expect(move.accuracy).toBe(100);
				expect(move.priority).toBe(0);
			}
		}
	});

	it('does not expose information outside Phase 1 in the readable text', () => {
		const combat = startCombat();
		const text = DuelmonCombatReport.fromCombat(combat).toString();
		const historyText = DuelmonCombatHistory.start(combat).entries()[0]?.text;

		for (const detail of ['PP', 'accuracy', 'priority', 'status', 'seed', 'attack', 'defense', 'speed', 'level']) {
			expect(text).not.toContain(detail);
			expect(historyText).not.toContain(detail);
		}
	});

	it('records the start in the history from the same combat', () => {
		const combat = startCombat();
		const history = DuelmonCombatHistory.start(combat);
		const entries = history.entries();

		expect(entries).toHaveLength(1);

		const [entry] = entries;

		expect(entry?.kind).toBe('start');
		expect(entry?.combat).toEqual(combat.toPrimitives());
		expect(entry?.text).toBe(DuelmonCombatReport.fromCombat(combat).toString());
		expect(history.toPrimitives().entries).toHaveLength(1);
	});
});
