import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { CombatEngine, CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatEngine as CombatEngineEntity, CombatOutcome, CombatSetup } from '@pocket-forge/combat-engine/domain';
import {
	COMPLETION_CONFIG_DEFINITIONS,
	COMPLETION_CONFIG_KEYS,
	ThresholdCombatCompletionRule,
} from '@pocket-forge/combat-engine/rules';
import { DuelmonCombatStart, DuelmonCombatTurn, Gen1BattleStats } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const CATALOG = DuelmonCombatStartMother.catalog();
const PLUGIN = DuelmonCombatMother.plugin();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';
const BINDINGS = DuelmonCombatMother.useMoveBindings([PLAYER_MOVE, OPPONENT_MOVE, 'tackle']);
const RULES: readonly CombatRule[] = [DuelmonCombatMother.compositionRule()];

interface CombatOverrides {
	readonly opponentHp?: number;
	readonly opponentSpeed?: number;
	readonly playerFirst?: boolean;
	readonly playerHp?: number;
	readonly playerSpeed?: number;
}

class TurnResolutionFixture {
	static combat(overrides: CombatOverrides = {}): Combat {
		const primitives: CombatPrimitives = this.startCombat().toPrimitives();
		const player = primitives.groups.find(group => group.id === 'player');
		const opponent = primitives.groups.find(group => group.id === 'opponent');
		const playerCombatant = player?.combatants[0];
		const opponentCombatant = opponent?.combatants[0];

		if (!playerCombatant || !opponentCombatant) {
			throw new Error('Started combat is missing a combatant');
		}

		if (overrides.playerSpeed !== undefined) {
			playerCombatant.attributes['speed'] = overrides.playerSpeed;
		}

		if (overrides.opponentSpeed !== undefined) {
			opponentCombatant.attributes['speed'] = overrides.opponentSpeed;
		}

		if (overrides.opponentHp !== undefined) {
			opponentCombatant.attributes['hp'] = overrides.opponentHp;
		}

		if (overrides.playerHp !== undefined) {
			playerCombatant.attributes['hp'] = overrides.playerHp;
		}

		if (overrides.playerFirst === false) {
			primitives.groups.reverse();
		}

		return CombatEntity.fromPrimitives(primitives);
	}

	static declarations() {
		return [this.input(PLAYER, PLAYER_MOVE, OPPONENT), this.input(OPPONENT, OPPONENT_MOVE, PLAYER)];
	}

	static drawRules(): readonly CombatRule[] {
		return [
			DuelmonCombatMother.compositionRule(),
			ThresholdCombatCompletionRule.create(
				{
					attributes: {
						[COMPLETION_CONFIG_KEYS.attributeKey]: 'hp',
						[COMPLETION_CONFIG_KEYS.comparison]: 'lte',
						[COMPLETION_CONFIG_KEYS.threshold]: 50,
						[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'threshold-group',
					},
				},
				[...COMPLETION_CONFIG_DEFINITIONS],
				[...Gen1BattleStats.DEFINITIONS]
			).getRight(),
		];
	}

	static engine(rules: readonly CombatRule[] = RULES): CombatEngine {
		return new CombatEngineEntity(
			CombatSetup.create({
				actionBindings: BINDINGS,
				actions: PLUGIN,
				rules,
			})
		);
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

	static startCombat(): Combat {
		const result = DuelmonCombatStart.fromContent(
			DuelmonCombatStartMother.request(),
			CATALOG,
			DuelmonCombatStartMother.DEFINITIONS
		);

		expect(result.isRight()).toBe(true);

		return result.getRight();
	}

	static turn(rules: readonly CombatRule[] = RULES): DuelmonCombatTurn {
		return new DuelmonCombatTurn(CATALOG, this.engine(rules));
	}
}

describe('Phase 1 turn resolution', () => {
	it('resolves the faster combatant first and the slower one afterwards', () => {
		const result = TurnResolutionFixture.turn().resolve(
			TurnResolutionFixture.startCombat(),
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(TurnResolutionFixture.moveUsedPairs(result.getRight().resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('updates the battle state after each action', () => {
		const combatState = TurnResolutionFixture.startCombat();
		const engineInstance = TurnResolutionFixture.engine();
		const first = engineInstance
			.resolve(combatState, TurnResolutionFixture.input(PLAYER, PLAYER_MOVE, OPPONENT))
			.getRight();
		const second = engineInstance
			.resolve(first.combat, TurnResolutionFixture.input(OPPONENT, OPPONENT_MOVE, PLAYER))
			.getRight();
		const result = TurnResolutionFixture.turn().resolve(combatState, TurnResolutionFixture.declarations());

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight().resolution;

		expect(resolution.combat.toPrimitives()).toEqual(second.combat.toPrimitives());
		expect(resolution.events.map(event => event.payload)).toEqual(
			[...first.events, ...second.events].map(event => event.payload)
		);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
	});

	it('resolves exactly the Move declared by each side', () => {
		const result = TurnResolutionFixture.turn().resolve(
			TurnResolutionFixture.startCombat(),
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(TurnResolutionFixture.moveUsedPairs(result.getRight().resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('does not resolve actions outside the declarations', () => {
		const result = TurnResolutionFixture.turn().resolve(
			TurnResolutionFixture.startCombat(),
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		const declared = new Set([`${OPPONENT}:${OPPONENT_MOVE}`, `${PLAYER}:${PLAYER_MOVE}`]);

		for (const pair of TurnResolutionFixture.moveUsedPairs(result.getRight().resolution.events)) {
			expect(declared.has(pair)).toBe(true);
		}
	});

	it('applies the fixed tie order when both combatants have the same Speed', () => {
		const inCombatOrder = TurnResolutionFixture.turn().resolve(
			TurnResolutionFixture.combat({ opponentSpeed: 70 }),
			TurnResolutionFixture.declarations()
		);

		expect(inCombatOrder.isRight()).toBe(true);
		expect(TurnResolutionFixture.moveUsedPairs(inCombatOrder.getRight().resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);

		const reversedGroups = TurnResolutionFixture.turn().resolve(
			TurnResolutionFixture.combat({ opponentSpeed: 70, playerFirst: false }),
			TurnResolutionFixture.declarations()
		);

		expect(reversedGroups.isRight()).toBe(true);
		expect(TurnResolutionFixture.moveUsedPairs(reversedGroups.getRight().resolution.events)).toEqual([
			`${OPPONENT}:${OPPONENT_MOVE}`,
			`${PLAYER}:${PLAYER_MOVE}`,
		]);
	});

	it('does not resolve anything or consume randomness when a declaration is invalid', () => {
		const combatState = TurnResolutionFixture.startCombat();
		const before = combatState.toPrimitives();
		const result = TurnResolutionFixture.turn().resolve(combatState, [
			TurnResolutionFixture.input(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		expect(result.isLeft()).toBe(true);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('keeps the engine outcome and stops when an action completes the combat', () => {
		const result = TurnResolutionFixture.turn(TurnResolutionFixture.knockoutRules()).resolve(
			TurnResolutionFixture.combat({ opponentHp: 1 }),
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight().resolution;

		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual(CombatOutcome.victory('player'));
		expect(resolution.events.map(event => event.type)).toEqual(['move-used', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(TurnResolutionFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
	});

	it('keeps a draw outcome without a winner and stops the turn', () => {
		const result = TurnResolutionFixture.turn(TurnResolutionFixture.drawRules()).resolve(
			TurnResolutionFixture.combat({ opponentHp: 40, playerHp: 40 }),
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const { actions, resolution } = result.getRight();

		expect(actions.map(action => action.actorId)).toEqual([PLAYER]);
		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual(CombatOutcome.draw());
		expect(resolution.outcome?.isDraw()).toBe(true);
		expect(resolution.outcome?.isVictory()).toBe(false);
		expect(resolution.events.map(event => event.type)).toEqual(['move-used', 'combat-completed']);
		expect(TurnResolutionFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
		expect(resolution.events.some(event => event.payload['attackerId'] === OPPONENT)).toBe(false);
	});

	it('stops after the first action without resolving, emitting events for, or drawing randomness for the second', () => {
		const combatState = TurnResolutionFixture.combat({ opponentHp: 1 });
		const first = TurnResolutionFixture.engine(TurnResolutionFixture.knockoutRules())
			.resolve(combatState, TurnResolutionFixture.input(PLAYER, PLAYER_MOVE, OPPONENT))
			.getRight();
		const result = TurnResolutionFixture.turn(TurnResolutionFixture.knockoutRules()).resolve(
			combatState,
			TurnResolutionFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight().resolution;

		expect(resolution.combat.status).toBe('completed');
		expect(resolution.combat.toPrimitives()).toEqual(first.combat.toPrimitives());
		expect(resolution.combat.randomPocket.toPrimitives()).toEqual(first.combat.randomPocket.toPrimitives());
		expect(resolution.combat.randomPocket.toPrimitives()).not.toEqual({ seed: 42, state: 42 });
		expect(resolution.outcome).toEqual(CombatOutcome.victory('player'));
		expect(resolution.outcome?.isVictory() ? resolution.outcome.winnerGroupId : undefined).toBe('player');
		expect(resolution.events.map(event => event.payload)).toEqual(first.events.map(event => event.payload));
		expect(resolution.events.map(event => event.type)).toEqual(['move-used', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(TurnResolutionFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
		expect(resolution.events.some(event => event.payload['attackerId'] === OPPONENT)).toBe(false);
	});

	it('rejects a turn over a completed combat without resolving or drawing randomness', () => {
		const completed = TurnResolutionFixture.turn(TurnResolutionFixture.knockoutRules())
			.resolve(TurnResolutionFixture.combat({ opponentHp: 1 }), TurnResolutionFixture.declarations())
			.getRight().resolution;
		const before = completed.combat.toPrimitives();
		const result = TurnResolutionFixture.turn(TurnResolutionFixture.knockoutRules()).resolve(
			completed.combat,
			TurnResolutionFixture.declarations()
		);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
		expect(completed.combat.toPrimitives()).toEqual(before);
		expect(completed.combat.status).toBe('completed');
	});
});
