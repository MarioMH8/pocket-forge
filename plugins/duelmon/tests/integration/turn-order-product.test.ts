import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatEngine as CombatEngineEntity, CombatSetup } from '@pocket-forge/combat-engine/domain';
import {
	DuelmonCombat,
	DuelmonCombatHistory,
	DuelmonCombatStart,
	DuelmonCombatTurn,
} from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

/*
 * Product tests for the Phase 1 turn order (#128).
 *
 * Every scenario starts from the real content contract, composes the real
 * `DuelmonCombatPlugin`, the real action bindings, the real composition and
 * knockout rules, and the real `Gen1UseMoveMechanics`. Nothing in this file
 * replaces the engine, the plugin, or the actions with a double.
 *
 * Phase 1 has no Move priority, no stat stages, no paralysis, and no random
 * tie-break: only the raw `speed` attribute orders the turn. Those behaviours
 * belong to Phase 2 and are not simulated here.
 */

const CATALOG = DuelmonCombatStartMother.catalog();
const PLUGIN = DuelmonCombatMother.plugin();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';
const TACKLE = 'tackle';
const BINDINGS = DuelmonCombatMother.useMoveBindings([PLAYER_MOVE, OPPONENT_MOVE, TACKLE]);
const BATTLE_RULES: readonly CombatRule[] = [DuelmonCombatMother.compositionRule()];

interface CombatOverrides {
	readonly opponentAttributes?: AttributeValues;
	readonly opponentFirst?: boolean;
	readonly opponentHp?: number;
	readonly opponentSpeed?: number;
	readonly playerAttributes?: AttributeValues;
	readonly playerHp?: number;
	readonly playerSpeed?: number;
	readonly seed?: number;
}

class TurnOrderProductFixture {
	static combat(overrides: CombatOverrides = {}): Combat {
		const primitives: CombatPrimitives = {
			...this.startCombat().toPrimitives(),
			...(overrides.seed !== undefined && { randomPocket: { seed: overrides.seed, state: overrides.seed } }),
		};
		const player = primitives.groups.find(group => group.id === 'player')?.combatants[0];
		const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

		if (!player || !opponent) {
			throw new Error('Started combat is missing a combatant');
		}

		if (overrides.playerSpeed !== undefined) {
			player.attributes['speed'] = overrides.playerSpeed;
		}

		if (overrides.opponentSpeed !== undefined) {
			opponent.attributes['speed'] = overrides.opponentSpeed;
		}

		if (overrides.playerHp !== undefined) {
			player.attributes['hp'] = overrides.playerHp;
		}

		if (overrides.opponentHp !== undefined) {
			opponent.attributes['hp'] = overrides.opponentHp;
		}

		Object.assign(player.attributes, overrides.playerAttributes ?? {});
		Object.assign(opponent.attributes, overrides.opponentAttributes ?? {});

		if (overrides.opponentFirst) {
			primitives.groups.reverse();
		}

		return CombatEntity.fromPrimitives(primitives);
	}

	static declarations(playerMove = PLAYER_MOVE, opponentMove = OPPONENT_MOVE) {
		return [this.input(PLAYER, playerMove, OPPONENT), this.input(OPPONENT, opponentMove, PLAYER)];
	}

	static engine(rules: readonly CombatRule[] = BATTLE_RULES): CombatEngineEntity {
		return new CombatEngineEntity(
			CombatSetup.create({
				actionBindings: BINDINGS,
				actions: PLUGIN,
				rules,
			})
		);
	}

	static eventAttackerIds(events: readonly { payload: Record<string, unknown>; type: string }[]): string[] {
		return events.filter(event => event.type === 'move-used').map(event => String(event.payload['attackerId']));
	}

	static failureIds(
		failures: readonly { message: string; path: string | undefined; reason: string }[]
	): readonly string[] {
		return failures.map(failure => `${failure.reason} at ${failure.path ?? '<root>'}: ${failure.message}`);
	}

	static hpOf(state: Combat, combatantId: string): number {
		const combatant = DuelmonCombat.fromCombat(state)
			.groups()
			.flatMap(group => group.combatants())
			.find(candidate => candidate.id === combatantId);

		if (!combatant) {
			throw new Error(`Missing combatant "${combatantId}"`);
		}

		return combatant.hp;
	}

	static input(actorId: string, moveId: string, targetId: string) {
		return {
			actorId,
			moveId,
			target: { id: targetId, scope: 'combatant' as const },
		};
	}

	static knockoutRules(): readonly CombatRule[] {
		return [DuelmonCombatMother.compositionRule(), DuelmonCombatMother.hpCompletionRule()];
	}

	static moveUsedPairs(events: readonly { payload: Record<string, unknown>; type: string }[]): readonly string[] {
		return events
			.filter(event => event.type === 'move-used')
			.map(event => `${String(event.payload['attackerId'])}:${String(event.payload['moveId'])}`);
	}

	static recorded(combatState: Combat, result: ReturnType<DuelmonCombatTurn['resolve']>): DuelmonCombatHistory {
		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			throw new Error('Expected a resolved turn');
		}

		return DuelmonCombatHistory.start(combatState).recordTurn(result.getRight());
	}

	static startCombat(): Combat {
		const result = DuelmonCombatStart.fromContent(
			DuelmonCombatStartMother.request(),
			CATALOG,
			DuelmonCombatStartMother.DEFINITIONS
		);

		expect(result.isRight()).toBe(true);

		return result.getRight();
	}

	static turn(rules: readonly CombatRule[] = BATTLE_RULES): DuelmonCombatTurn {
		return new DuelmonCombatTurn(CATALOG, this.engine(rules));
	}
}

describe('Phase 1 turn order product scenarios', () => {
	it('resolves the faster player first and reflects the state after each action', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();

		expect(actions.map(action => `${action.actorId}:${action.moveId}:${action.targetId}`)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}:${OPPONENT}`,
			`${OPPONENT}:${OPPONENT_MOVE}:${PLAYER}`,
		]);
		expect(TurnOrderProductFixture.moveUsedPairs(resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);

		const [first, second] = actions;

		if (!first || !second) {
			throw new Error('Expected two resolved actions');
		}

		expect([
			TurnOrderProductFixture.hpOf(first.combat, PLAYER),
			TurnOrderProductFixture.hpOf(first.combat, OPPONENT),
		]).toEqual([99, 89]);
		expect([
			TurnOrderProductFixture.hpOf(second.combat, PLAYER),
			TurnOrderProductFixture.hpOf(second.combat, OPPONENT),
		]).toEqual([57, 89]);
		expect([
			TurnOrderProductFixture.hpOf(resolution.combat, PLAYER),
			TurnOrderProductFixture.hpOf(resolution.combat, OPPONENT),
		]).toEqual([57, 89]);
		expect(resolution.combat.status).toBe('active');
	});

	it('resolves the faster opponent first when the opponent has the higher Speed', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentSpeed: 100 });
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();

		expect(actions.map(action => action.actorId)).toEqual([OPPONENT, PLAYER]);
		expect(TurnOrderProductFixture.moveUsedPairs(resolution.events)).toEqual([
			`${OPPONENT}:${OPPONENT_MOVE}`,
			`${PLAYER}:${PLAYER_MOVE}`,
		]);

		const [first, second] = actions;

		if (!first || !second) {
			throw new Error('Expected two resolved actions');
		}

		expect([
			TurnOrderProductFixture.hpOf(first.combat, PLAYER),
			TurnOrderProductFixture.hpOf(first.combat, OPPONENT),
		]).toEqual([54, 104]);
		expect([
			TurnOrderProductFixture.hpOf(second.combat, PLAYER),
			TurnOrderProductFixture.hpOf(second.combat, OPPONENT),
		]).toEqual([54, 90]);
		expect(
			TurnOrderProductFixture.recorded(combatState, result)
				.entries()
				.map(entry => entry.action?.actorId ?? entry.kind)
		).toEqual(['start', OPPONENT, PLAYER]);
	});

	it('breaks equal Speed by the documented combat order regardless of the declaration order', () => {
		const inCombatOrder = TurnOrderProductFixture.turn().resolve(
			TurnOrderProductFixture.combat({ opponentSpeed: 70 }),
			[
				TurnOrderProductFixture.input(OPPONENT, OPPONENT_MOVE, PLAYER),
				TurnOrderProductFixture.input(PLAYER, PLAYER_MOVE, OPPONENT),
			]
		);
		const reversedGroups = TurnOrderProductFixture.turn().resolve(
			TurnOrderProductFixture.combat({ opponentFirst: true, opponentSpeed: 70 }),
			TurnOrderProductFixture.declarations()
		);

		expect(inCombatOrder.isRight()).toBe(true);
		expect(reversedGroups.isRight()).toBe(true);

		if (inCombatOrder.isLeft() || reversedGroups.isLeft()) {
			return;
		}

		expect(inCombatOrder.getRight().actions.map(action => action.actorId)).toEqual([PLAYER, OPPONENT]);
		expect(reversedGroups.getRight().actions.map(action => action.actorId)).toEqual([OPPONENT, PLAYER]);
		expect(TurnOrderProductFixture.moveUsedPairs(inCombatOrder.getRight().resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
		expect(TurnOrderProductFixture.moveUsedPairs(reversedGroups.getRight().resolution.events)).toEqual([
			`${OPPONENT}:${OPPONENT_MOVE}`,
			`${PLAYER}:${PLAYER_MOVE}`,
		]);
	});

	it('keeps the equal-Speed order across different random seeds', () => {
		const orders = [7, 99].map(seed => {
			const result = TurnOrderProductFixture.turn().resolve(
				TurnOrderProductFixture.combat({ opponentSpeed: 70, seed }),
				TurnOrderProductFixture.declarations()
			);

			expect(result.isRight()).toBe(true);

			return result.isRight() ? result.getRight().actions.map(action => action.actorId) : [];
		});

		expect(orders).toEqual([
			[PLAYER, OPPONENT],
			[PLAYER, OPPONENT],
		]);
	});

	it('is reproducible from the same starting point without mutating the combat', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentSpeed: 70 });
		const before = combatState.toPrimitives();
		const first = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());
		const second = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(first.isRight()).toBe(true);
		expect(second.isRight()).toBe(true);

		if (first.isLeft() || second.isLeft()) {
			return;
		}

		expect(first.getRight().resolution.combat.toPrimitives()).toEqual(
			second.getRight().resolution.combat.toPrimitives()
		);
		expect(first.getRight().resolution.events).toEqual(second.getRight().resolution.events);
		expect(TurnOrderProductFixture.recorded(combatState, first).toPrimitives()).toEqual(
			TurnOrderProductFixture.recorded(combatState, second).toPrimitives()
		);
		expect(combatState.toPrimitives()).toEqual(before);
	});

	it('stops after the faster player knocks the opponent out in the first action', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentHp: 15 });
		const result = TurnOrderProductFixture.turn(TurnOrderProductFixture.knockoutRules()).resolve(
			combatState,
			TurnOrderProductFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();
		const [first] = actions;
		const history = TurnOrderProductFixture.recorded(combatState, result);

		expect(actions).toHaveLength(1);
		expect(actions.map(action => action.actorId)).toEqual([PLAYER]);
		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome?.isVictory()).toBe(true);
		expect(resolution.outcome?.isVictory() ? resolution.outcome.winnerGroupId : undefined).toBe('player');
		expect(TurnOrderProductFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
		expect(resolution.events.map(event => event.type)).toEqual(['move-used', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(resolution.events.some(event => event.payload['attackerId'] === OPPONENT)).toBe(false);
		expect(history.entries().map(entry => entry.kind)).toEqual(['start', 'action']);
		expect(history.entries()[1]?.action).toEqual({
			actorId: PLAYER,
			moveId: PLAYER_MOVE,
			speed: 70,
			targetId: OPPONENT,
			tieBreak: false,
		});
		expect([
			TurnOrderProductFixture.hpOf(resolution.combat, PLAYER),
			TurnOrderProductFixture.hpOf(resolution.combat, OPPONENT),
		]).toEqual([99, 0]);

		if (!first) {
			throw new Error('Expected the completing action');
		}

		expect(resolution.combat.toPrimitives()).toEqual(first.combat.toPrimitives());
		expect(resolution.combat.randomPocket.toPrimitives()).toEqual(first.combat.randomPocket.toPrimitives());
		expect(
			first.combat
				.toPrimitives()
				.groups.flatMap(group => group.combatants)
				.find(combatant => combatant.id === OPPONENT)?.attributes['movePp']
		).toBeUndefined();
	});

	it('does not resolve or draw randomness for the omitted action after the knockout', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentHp: 15 });
		const result = TurnOrderProductFixture.turn(TurnOrderProductFixture.knockoutRules()).resolve(
			combatState,
			TurnOrderProductFixture.declarations()
		);
		const control = TurnOrderProductFixture.turn(TurnOrderProductFixture.knockoutRules()).resolve(
			TurnOrderProductFixture.combat({ opponentHp: 16 }),
			TurnOrderProductFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(control.isRight()).toBe(true);

		if (result.isLeft() || control.isLeft()) {
			return;
		}

		const resolution = result.getRight().resolution;
		const controlResolution = control.getRight().resolution;

		/*
		 * The control keeps the same seed, content, rules, and first action, but
		 * lets the second action resolve. It proves the omitted action would have
		 * emitted an event and advanced the RandomPocket, so their absence after the
		 * knockout is a real guarantee instead of a coincidence.
		 */
		expect(control.getRight().actions.map(action => action.actorId)).toEqual([PLAYER, OPPONENT]);
		expect(controlResolution.outcome).toBeUndefined();
		expect(controlResolution.combat.status).toBe('active');
		expect(TurnOrderProductFixture.moveUsedPairs(controlResolution.events)).toContain(
			`${OPPONENT}:${OPPONENT_MOVE}`
		);
		expect(control.getRight().actions[0]?.combat.randomPocket.toPrimitives()).toEqual(
			result.getRight().actions[0]?.combat.randomPocket.toPrimitives()
		);
		expect(controlResolution.combat.randomPocket.toPrimitives()).not.toEqual(
			resolution.combat.randomPocket.toPrimitives()
		);
		expect(resolution.combat.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 2_581_720_956 });

		/*
		 * Phase 1 does not model Move PP (see #125), so the product check for the
		 * omitted action is structural: no action, no event, no history entry, and no
		 * randomness draw. The final snapshot is exactly the first action's successor,
		 * so no attribute of the skipped actor changes.
		 */
		expect(result.getRight().actions).toHaveLength(1);
		expect(TurnOrderProductFixture.recorded(combatState, result).entries()).toHaveLength(2);
		expect(
			CombatEntity.fromPrimitives(resolution.combat.toPrimitives())
				.toPrimitives()
				.groups.flatMap(group => group.combatants)
				.map(combatant => [combatant.id, combatant.attributes['hp']])
		).toEqual([
			[PLAYER, 99],
			[OPPONENT, 0],
		]);
	});

	it('stops after the faster opponent knocks the player out in the first action', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentSpeed: 100, playerHp: 42 });
		const result = TurnOrderProductFixture.turn(TurnOrderProductFixture.knockoutRules()).resolve(
			combatState,
			TurnOrderProductFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();

		expect(actions.map(action => action.actorId)).toEqual([OPPONENT]);
		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome?.isVictory() ? resolution.outcome.winnerGroupId : undefined).toBe('opponent');
		expect(TurnOrderProductFixture.moveUsedPairs(resolution.events)).toEqual([`${OPPONENT}:${OPPONENT_MOVE}`]);
		expect([
			TurnOrderProductFixture.hpOf(resolution.combat, PLAYER),
			TurnOrderProductFixture.hpOf(resolution.combat, OPPONENT),
		]).toEqual([0, 104]);
		expect(
			TurnOrderProductFixture.recorded(combatState, result)
				.entries()
				.map(entry => entry.kind)
		).toEqual(['start', 'action']);
	});

	it('skips the second action when the first leaves the other at zero HP without a completion rule', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentHp: 15 });
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();
		const history = TurnOrderProductFixture.recorded(combatState, result);

		expect(actions).toHaveLength(1);
		expect(actions.map(action => action.actorId)).toEqual([PLAYER]);
		expect(resolution.outcome).toBeUndefined();
		expect(resolution.combat.status).toBe('active');
		expect(TurnOrderProductFixture.hpOf(resolution.combat, OPPONENT)).toBe(0);
		expect(TurnOrderProductFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
		expect(resolution.events.some(event => event.payload['attackerId'] === OPPONENT)).toBe(false);
		expect(history.entries().map(entry => entry.kind)).toEqual(['start', 'action']);
		expect(history.entries()[1]?.action?.actorId).toBe(PLAYER);
		expect(history.entries().at(-1)?.combat).toEqual(resolution.combat.toPrimitives());

		const [only] = actions;

		if (!only) {
			throw new Error('Expected one resolved action');
		}

		expect(resolution.combat.toPrimitives()).toEqual(only.combat.toPrimitives());
	});

	it('rejects an absent declaration list without resolving or changing the combat', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const before = combatState.toPrimitives();
		const result = TurnOrderProductFixture.turn().resolve(combatState, []);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(TurnOrderProductFixture.failureIds(result.getLeft())).toEqual([
			'invalid-input at declarations: A Phase 1 turn requires exactly one declaration per group, received 0',
			'invalid-input at declarations: Missing declaration for group "player"',
			'invalid-input at declarations: Missing declaration for group "opponent"',
		]);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('rejects a missing declaration without resolving or changing the combat', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const before = combatState.toPrimitives();
		const result = TurnOrderProductFixture.turn().resolve(combatState, [
			TurnOrderProductFixture.input(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(TurnOrderProductFixture.failureIds(result.getLeft())).toEqual([
			'invalid-input at declarations: A Phase 1 turn requires exactly one declaration per group, received 1',
			'invalid-input at declarations: Missing declaration for group "opponent"',
		]);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('rejects a duplicated declaration without resolving or changing the combat', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const before = combatState.toPrimitives();
		const result = TurnOrderProductFixture.turn().resolve(combatState, [
			TurnOrderProductFixture.input(PLAYER, PLAYER_MOVE, OPPONENT),
			TurnOrderProductFixture.input(PLAYER, TACKLE, OPPONENT),
		]);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(TurnOrderProductFixture.failureIds(result.getLeft())).toEqual([
			'invalid-input at declarations.1.input.actorId: Duplicate declaration for actor "player-emberling" (already declared at declarations.0)',
			'invalid-input at declarations: Missing declaration for group "opponent"',
		]);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('rejects an unknown or unknown-to-the-creature Move without resolving', () => {
		for (const [moveId, expected] of [
			[
				'missing-move',
				[
					'invalid-input at declarations.0.input.moveId: Unknown Move "missing-move" in the Duelmon catalog',
					'invalid-input at declarations: Missing declaration for group "player"',
				],
			],
			[
				OPPONENT_MOVE,
				[
					'rejected at declarations.0.input.moveId: Combatant "player-emberling" does not know Move "aqua-burst"',
					'invalid-input at declarations: Missing declaration for group "player"',
				],
			],
		] as const) {
			const combatState = TurnOrderProductFixture.startCombat();
			const before = combatState.toPrimitives();
			const result = TurnOrderProductFixture.turn().resolve(
				combatState,
				TurnOrderProductFixture.declarations(moveId)
			);

			expect(result.isLeft()).toBe(true);

			if (result.isRight()) {
				continue;
			}

			expect(TurnOrderProductFixture.failureIds(result.getLeft())).toEqual(expected);
			expect(combatState.toPrimitives()).toEqual(before);
			expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
		}
	});

	it('rejects an invalid target without resolving or changing the combat', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const before = combatState.toPrimitives();
		const result = TurnOrderProductFixture.turn().resolve(combatState, [
			TurnOrderProductFixture.input(PLAYER, PLAYER_MOVE, PLAYER),
			TurnOrderProductFixture.input(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(TurnOrderProductFixture.failureIds(result.getLeft())).toEqual([
			'invalid-target at declarations.0.input.target.id: Target "player-emberling" is not in the opposing group',
			'invalid-input at declarations: Missing declaration for group "player"',
		]);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('lets a reader explain the order from the history alone', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const [, first, second] = TurnOrderProductFixture.recorded(combatState, result).entries();

		expect(first?.action).toEqual({
			actorId: PLAYER,
			moveId: PLAYER_MOVE,
			speed: 70,
			targetId: OPPONENT,
			tieBreak: false,
		});
		expect(second?.action).toEqual({
			actorId: OPPONENT,
			moveId: OPPONENT_MOVE,
			speed: 48,
			targetId: PLAYER,
			tieBreak: false,
		});

		const explanation = [first?.text ?? '', second?.text ?? ''].join('\n');

		expect(explanation).toContain('(Speed 70 > 48)');
		expect(explanation).toContain('(Speed 48 < 70)');
		expect(first?.text.startsWith(`${PLAYER} acted first with ${PLAYER_MOVE} on ${OPPONENT}`)).toBe(true);
		expect(second?.text.startsWith(`${OPPONENT} acted second with ${OPPONENT_MOVE} on ${PLAYER}`)).toBe(true);
	});

	it('explains an equal-Speed tie from the history alone', () => {
		const combatState = TurnOrderProductFixture.combat({ opponentSpeed: 70 });
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const [, first, second] = TurnOrderProductFixture.recorded(combatState, result).entries();

		expect(first?.action).toEqual({
			actorId: PLAYER,
			moveId: PLAYER_MOVE,
			speed: 70,
			targetId: OPPONENT,
			tieBreak: true,
		});
		expect(second?.action).toEqual({
			actorId: OPPONENT,
			moveId: OPPONENT_MOVE,
			speed: 70,
			targetId: PLAYER,
			tieBreak: true,
		});
		expect(first?.text).toContain('(Speed 70 = 70, fixed combat order)');
		expect(second?.text).toContain('(Speed 70 = 70, fixed combat order)');
	});

	it('records the real order, identity, and successor snapshot of every action', () => {
		const combatState = TurnOrderProductFixture.startCombat();
		const result = TurnOrderProductFixture.turn().resolve(combatState, TurnOrderProductFixture.declarations());

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const turnResult = result.getRight();
		const history = DuelmonCombatHistory.start(combatState).recordTurn(turnResult);
		const [start, first, second] = history.entries();

		expect(history.entries().map(entry => entry.kind)).toEqual(['start', 'action', 'action']);
		expect(start?.combat).toEqual(combatState.toPrimitives());
		expect(first?.action).toEqual({
			actorId: PLAYER,
			moveId: PLAYER_MOVE,
			speed: 70,
			targetId: OPPONENT,
			tieBreak: false,
		});
		expect(second?.action).toEqual({
			actorId: OPPONENT,
			moveId: OPPONENT_MOVE,
			speed: 48,
			targetId: PLAYER,
			tieBreak: false,
		});
		expect(
			history
				.entries()
				.slice(1)
				.map(entry => entry.action?.actorId)
		).toEqual(turnResult.actions.map(action => action.actorId));
		expect(
			history
				.entries()
				.slice(1)
				.map(entry => entry.action?.actorId)
		).toEqual(TurnOrderProductFixture.eventAttackerIds(turnResult.resolution.events));

		const [firstAction, secondAction] = turnResult.actions;

		if (!first || !second || !firstAction || !secondAction) {
			throw new Error('Expected two action entries');
		}

		expect(first.combat).toEqual(firstAction.combat.toPrimitives());
		expect(second.combat).toEqual(secondAction.combat.toPrimitives());
		expect(history.entries().at(-1)?.combat).toEqual(turnResult.resolution.combat.toPrimitives());
		expect(TurnOrderProductFixture.hpOf(CombatEntity.fromPrimitives(first.combat), OPPONENT)).toBe(89);
		expect(TurnOrderProductFixture.hpOf(CombatEntity.fromPrimitives(first.combat), PLAYER)).toBe(99);
		expect(TurnOrderProductFixture.hpOf(CombatEntity.fromPrimitives(second.combat), PLAYER)).toBe(57);
		expect(TurnOrderProductFixture.hpOf(CombatEntity.fromPrimitives(second.combat), OPPONENT)).toBe(89);

		expect(first.text.startsWith(`${PLAYER} acted first with ${PLAYER_MOVE} on ${OPPONENT}`)).toBe(true);
		expect(first.text).toContain('(Speed 70 > 48)');
		expect(first.text).toContain('opponent-aquafin (aquafin) [Water] HP 89/104');
		expect(second.text.startsWith(`${OPPONENT} acted second with ${OPPONENT_MOVE} on ${PLAYER}`)).toBe(true);
		expect(second.text).toContain('(Speed 48 < 70)');
		expect(second.text).toContain('player-emberling (emberling) [Fire] HP 57/99');
		expect(second.text).toContain('opponent-aquafin (aquafin) [Water] HP 89/104');

		const primitives = history.toPrimitives();

		expect(DuelmonCombatHistory.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('does not depend on the declared Move or on speed stages', () => {
		const orders = [
			TurnOrderProductFixture.declarations(),
			TurnOrderProductFixture.declarations(TACKLE, OPPONENT_MOVE),
			TurnOrderProductFixture.declarations(TACKLE, TACKLE),
		].map(list => {
			const result = TurnOrderProductFixture.turn().resolve(TurnOrderProductFixture.startCombat(), list);

			expect(result.isRight()).toBe(true);

			return result.isRight() ? result.getRight().actions.map(action => action.actorId) : [];
		});

		expect(orders).toEqual([
			[PLAYER, OPPONENT],
			[PLAYER, OPPONENT],
			[PLAYER, OPPONENT],
		]);

		const staged = TurnOrderProductFixture.turn().resolve(
			TurnOrderProductFixture.combat({
				opponentAttributes: { speedStage: 6 },
				playerAttributes: { speedStage: -6 },
			}),
			TurnOrderProductFixture.declarations()
		);

		expect(staged.isRight()).toBe(true);
		expect(staged.isRight() ? staged.getRight().actions.map(action => action.actorId) : []).toEqual([
			PLAYER,
			OPPONENT,
		]);

		const playerMoves = DuelmonCombat.fromCombat(TurnOrderProductFixture.startCombat())
			.group('player')
			?.activeCombatants()[0]
			?.moves();
		const opponentMoves = DuelmonCombat.fromCombat(TurnOrderProductFixture.startCombat())
			.group('opponent')
			?.activeCombatants()[0]
			?.moves();

		for (const move of [...(playerMoves ?? []), ...(opponentMoves ?? [])]) {
			expect(move.priority).toBe(0);
		}
	});
});
