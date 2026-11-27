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
	readonly playerSpeed?: number;
}

function engine(rules: readonly CombatRule[] = RULES): CombatEngine {
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

	if (overrides.playerFirst === false) {
		primitives.groups.reverse();
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

function moveUsedPairs(events: readonly { payload: Record<string, unknown>; type: string }[]): readonly string[] {
	return events
		.filter(event => event.type === 'move-used')
		.map(event => `${String(event.payload['attackerId'])}:${String(event.payload['moveId'])}`);
}

function hpCompletionRule(): CombatRule {
	return ThresholdCombatCompletionRule.create(
		{
			attributes: {
				[COMPLETION_CONFIG_KEYS.attributeKey]: 'hp',
				[COMPLETION_CONFIG_KEYS.comparison]: 'lte',
				[COMPLETION_CONFIG_KEYS.threshold]: 0,
				[COMPLETION_CONFIG_KEYS.winnerPolicy]: 'opposing-group',
			},
		},
		[...COMPLETION_CONFIG_DEFINITIONS],
		[...Gen1BattleStats.DEFINITIONS]
	).getRight();
}

describe('Phase 1 turn resolution', () => {
	it('resolves the faster combatant first and the slower one afterwards', () => {
		const result = turn().resolve(startCombat(), declarations());

		expect(result.isRight()).toBe(true);
		expect(moveUsedPairs(result.getRight().events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('updates the battle state after each action', () => {
		const combatState = startCombat();
		const engineInstance = engine();
		const first = engineInstance.resolve(combatState, input(PLAYER, PLAYER_MOVE, OPPONENT)).getRight();
		const second = engineInstance.resolve(first.combat, input(OPPONENT, OPPONENT_MOVE, PLAYER)).getRight();
		const result = turn().resolve(combatState, declarations());

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();

		expect(resolution.combat.toPrimitives()).toEqual(second.combat.toPrimitives());
		expect(resolution.events.map(event => event.payload)).toEqual(
			[...first.events, ...second.events].map(event => event.payload)
		);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
	});

	it('resolves exactly the Move declared by each side', () => {
		const result = turn().resolve(startCombat(), declarations());

		expect(result.isRight()).toBe(true);
		expect(moveUsedPairs(result.getRight().events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('does not resolve actions outside the declarations', () => {
		const result = turn().resolve(startCombat(), declarations());

		expect(result.isRight()).toBe(true);

		const declared = new Set([`${OPPONENT}:${OPPONENT_MOVE}`, `${PLAYER}:${PLAYER_MOVE}`]);

		for (const pair of moveUsedPairs(result.getRight().events)) {
			expect(declared.has(pair)).toBe(true);
		}
	});

	it('applies the fixed tie order when both combatants have the same Speed', () => {
		const inCombatOrder = turn().resolve(combat({ opponentSpeed: 70 }), declarations());

		expect(inCombatOrder.isRight()).toBe(true);
		expect(moveUsedPairs(inCombatOrder.getRight().events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);

		const reversedGroups = turn().resolve(combat({ opponentSpeed: 70, playerFirst: false }), declarations());

		expect(reversedGroups.isRight()).toBe(true);
		expect(moveUsedPairs(reversedGroups.getRight().events)).toEqual([
			`${OPPONENT}:${OPPONENT_MOVE}`,
			`${PLAYER}:${PLAYER_MOVE}`,
		]);
	});

	it('does not resolve anything or consume randomness when a declaration is invalid', () => {
		const combatState = startCombat();
		const before = combatState.toPrimitives();
		const result = turn().resolve(combatState, [input(PLAYER, PLAYER_MOVE, OPPONENT)]);

		expect(result.isLeft()).toBe(true);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('keeps the engine outcome and stops when an action completes the combat', () => {
		const result = turn([DuelmonCombatMother.compositionRule(), hpCompletionRule()]).resolve(
			combat({ opponentHp: 1 }),
			declarations()
		);

		expect(result.isRight()).toBe(true);

		const resolution = result.getRight();

		expect(resolution.combat.status).toBe('completed');
		expect(resolution.outcome).toEqual(CombatOutcome.victory('player'));
		expect(resolution.events.map(event => event.type)).toEqual(['move-used', 'combat-completed']);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
		expect(moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
	});
});
