import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatEngine as CombatEngineEntity, CombatSetup } from '@pocket-forge/combat-engine/domain';
import {
	DuelmonCombatHistory,
	DuelmonCombatReport,
	DuelmonCombatStart,
	DuelmonCombatTurn,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const CATALOG = DuelmonCombatStartMother.catalog();
const PLUGIN = DuelmonCombatMother.plugin();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';
const BINDINGS = DuelmonCombatMother.useMoveBindings([PLAYER_MOVE, OPPONENT_MOVE]);
const RULES: readonly CombatRule[] = [DuelmonCombatMother.compositionRule()];

interface CombatOverrides {
	readonly opponentHp?: number;
}

function engine(rules: readonly CombatRule[] = RULES): CombatEngineEntity {
	return new CombatEngineEntity(
		CombatSetup.create({
			actionBindings: BINDINGS,
			actions: PLUGIN,
			rules,
		})
	);
}

function turn(rules: readonly CombatRule[] = RULES): DuelmonCombatTurn {
	return new DuelmonCombatTurn(CATALOG, engine(rules));
}

function startCombat(): Combat {
	const result = DuelmonCombatStart.fromContent(
		DuelmonCombatStartMother.request(),
		CATALOG,
		DuelmonCombatStartMother.DEFINITIONS
	);

	expect(result.isRight()).toBe(true);

	return result.getRight();
}

function combat(overrides: CombatOverrides = {}): Combat {
	const primitives: CombatPrimitives = startCombat().toPrimitives();
	const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

	if (!opponent) {
		throw new Error('Started combat is missing the opponent combatant');
	}

	if (overrides.opponentHp !== undefined) {
		opponent.attributes['hp'] = overrides.opponentHp;
	}

	return CombatEntity.fromPrimitives(primitives);
}

function input(actorId: string, moveId: string, targetId: string) {
	return {
		actorId,
		moveId,
		target: { id: targetId, scope: 'combatant' as const },
	};
}

function declarations() {
	return [input(PLAYER, PLAYER_MOVE, OPPONENT), input(OPPONENT, OPPONENT_MOVE, PLAYER)];
}

function knockoutRules(): readonly CombatRule[] {
	return [DuelmonCombatMother.compositionRule(), DuelmonCombatMother.hpCompletionRule()];
}

function eventAttackerIds(events: readonly { payload: Record<string, unknown>; type: string }[]): readonly string[] {
	return events
		.filter(event => event.type === 'move-used' || event.type === 'move-missed')
		.map(event => String(event.payload['attackerId']));
}

describe('Turn history', () => {
	it('records the real action order after the start', () => {
		const combatState = startCombat();
		const history = DuelmonCombatHistory.start(combatState);
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const turnResult = result.getRight();
		const recorded = history.recordTurn(turnResult);

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
		).toEqual([PLAYER_MOVE, OPPONENT_MOVE]);
		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.action?.targetId)
		).toEqual([OPPONENT, PLAYER]);
		expect(turnResult.actions.map(action => action.actorId)).toEqual([PLAYER, OPPONENT]);
		expect(eventAttackerIds(turnResult.resolution.events)).toEqual([PLAYER, OPPONENT]);
	});

	it('records the successor snapshot of each action', () => {
		const combatState = startCombat();
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const turnResult = result.getRight();
		const recorded = DuelmonCombatHistory.start(combatState).recordTurn(turnResult);

		expect(
			recorded
				.entries()
				.slice(1)
				.map(entry => entry.combat)
		).toEqual(turnResult.actions.map(action => action.combat.toPrimitives()));
		expect(recorded.entries().at(-1)?.combat).toEqual(turnResult.resolution.combat.toPrimitives());
	});

	it('records one readable entry per action with the report of its snapshot', () => {
		const combatState = startCombat();
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const recorded = DuelmonCombatHistory.start(combatState).recordTurn(result.getRight());
		const entry = recorded.entries()[1];

		if (!entry) {
			throw new Error('Missing first action entry');
		}

		expect(entry.text.startsWith('player-emberling acted first with ember-burst on opponent-aquafin')).toBe(true);
		expect(entry.text).toContain('(Speed 70 > 48)');
		expect(entry.text).toContain(
			DuelmonCombatReport.fromCombat(CombatEntity.fromPrimitives(entry.combat)).toString()
		);
	});

	it('records exactly the completing action when the first action ends the battle', () => {
		const combatState = combat({ opponentHp: 1 });
		const result = turn(knockoutRules()).resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const turnResult = result.getRight();
		const recorded = DuelmonCombatHistory.start(combatState).recordTurn(turnResult);
		const actions = recorded.entries().filter(entry => entry.kind === 'action');

		expect(turnResult.resolution.combat.status).toBe('completed');
		expect(turnResult.actions).toHaveLength(1);
		expect(actions).toHaveLength(1);
		expect(actions[0]?.action?.actorId).toBe(PLAYER);
		expect(actions.some(entry => entry.action?.actorId === OPPONENT)).toBe(false);
		expect(recorded.entries().map(entry => entry.kind)).toEqual(['start', 'action']);
	});

	it('does not duplicate an action', () => {
		const combatState = startCombat();
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const actions = DuelmonCombatHistory.start(combatState)
			.recordTurn(result.getRight())
			.entries()
			.slice(1)
			.flatMap(entry =>
				entry.action ? [`${entry.action.actorId}:${entry.action.moveId}:${entry.action.targetId}`] : []
			);

		expect(new Set(actions).size).toBe(actions.length);
	});

	it('appends a second turn without duplicating or losing the previous entries', () => {
		const combatState = startCombat();
		const firstTurn = turn().resolve(combatState, declarations());

		expect(firstTurn.isRight()).toBe(true);

		if (firstTurn.isLeft()) {
			return;
		}

		const firstHistory = DuelmonCombatHistory.start(combatState).recordTurn(firstTurn.getRight());
		const secondTurn = turn().resolve(firstTurn.getRight().resolution.combat, declarations());

		expect(secondTurn.isRight()).toBe(true);

		if (secondTurn.isLeft()) {
			return;
		}

		const secondHistory = firstHistory.recordTurn(secondTurn.getRight());

		expect(firstHistory.entries()).toHaveLength(3);
		expect(secondHistory.entries().map(entry => entry.action?.actorId ?? entry.kind)).toEqual([
			'start',
			PLAYER,
			OPPONENT,
			PLAYER,
			OPPONENT,
		]);
		expect(secondHistory.toPrimitives().entries.slice(0, 3)).toEqual([...firstHistory.toPrimitives().entries]);
		expect(secondHistory.entries().at(-1)?.combat).toEqual(secondTurn.getRight().resolution.combat.toPrimitives());
	});

	it('does not mutate the previous history and round-trips the recorded one', () => {
		const combatState = startCombat();
		const previous = DuelmonCombatHistory.start(combatState);
		const before = previous.toPrimitives();
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const recorded = previous.recordTurn(result.getRight());
		const primitives = recorded.toPrimitives();

		expect(recorded).not.toBe(previous);
		expect(previous.entries()).toHaveLength(1);
		expect(previous.toPrimitives()).toEqual(before);
		expect(DuelmonCombatHistory.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('is reproducible from the same starting point', () => {
		const first = turn().resolve(startCombat(), declarations());
		const second = turn().resolve(startCombat(), declarations());

		expect(first.isRight()).toBe(true);
		expect(second.isRight()).toBe(true);

		if (first.isLeft() || second.isLeft()) {
			return;
		}

		expect(DuelmonCombatHistory.start(startCombat()).recordTurn(first.getRight()).toPrimitives()).toEqual(
			DuelmonCombatHistory.start(startCombat()).recordTurn(second.getRight()).toPrimitives()
		);
	});
});
