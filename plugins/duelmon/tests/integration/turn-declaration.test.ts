import type { Combat } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { CombatResolutionErrorReason } from '@pocket-forge/combat-engine/domain';
import { DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLUGIN = DuelmonCombatMother.plugin();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';
const RESERVE_PLAYER = 'player-reserve';
const RESERVE_OPPONENT = 'opponent-reserve';

type DeclarationResult = ReturnType<typeof PLUGIN.resolve>;

function startCombat(): Combat {
	const result = DuelmonCombatStart.fromContent(
		DuelmonCombatStartMother.request(),
		DuelmonCombatStartMother.catalog(),
		DuelmonCombatStartMother.DEFINITIONS
	);

	expect(result.isRight()).toBe(true);

	return result.getRight();
}

function declaration(actorId: string, moveId: string, targetId: string) {
	return {
		actorId,
		moveId,
		target: { id: targetId, scope: 'combatant' as const },
	};
}

function bindings(moveIds: readonly string[] = [PLAYER_MOVE, OPPONENT_MOVE]) {
	return DuelmonCombatMother.useMoveBindings(moveIds);
}

function declare(combat: Combat, input: unknown, actionBindings = bindings()): DeclarationResult {
	return PLUGIN.resolve({ actionBindings, combat, input });
}

function expectRejected(
	result: DeclarationResult,
	expected: { path: string; reason: CombatResolutionErrorReason }
): void {
	expect(result.isLeft()).toBe(true);

	const errors = result.getLeft();

	expect(errors).toHaveLength(1);
	expect(errors[0]?.reason).toBe(expected.reason);
	expect(errors[0]?.path).toBe(expected.path);
}

/**
 * Derives a resolver fixture from the started combat with one reserve
 * combatant per group.
 *
 * The start contract and `OneVersusOneCombatRule` both require exactly one
 * combatant per group, so this snapshot is not a product-reachable 1v1 combat.
 * It exists only to exercise the resolver's activity guard, which Phase 1
 * cannot reach through a product-valid combat.
 */
function resolverCombatWithReserves(): Combat {
	const primitives = startCombat().toPrimitives();
	const [playerGroup, opponentGroup] = primitives.groups;

	if (!playerGroup || !opponentGroup) {
		throw new Error('Started combat is missing a group');
	}

	const player = playerGroup.combatants[0];
	const opponent = opponentGroup.combatants[0];

	if (!player || !opponent) {
		throw new Error('Started combat is missing a combatant');
	}

	const playerReserve = structuredClone(player);
	const opponentReserve = structuredClone(opponent);

	playerGroup.combatants.push({
		...playerReserve,
		creature: { ...playerReserve.creature, id: `${RESERVE_PLAYER}-creature` },
		id: RESERVE_PLAYER,
	});
	opponentGroup.combatants.push({
		...opponentReserve,
		creature: { ...opponentReserve.creature, id: `${RESERVE_OPPONENT}-creature` },
		id: RESERVE_OPPONENT,
	});

	return CombatEntity.fromPrimitives(primitives);
}

describe('Phase 1 turn declaration product scenarios', () => {
	it('accepts a declaration from the active combatant against the active opponent', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration(PLAYER, PLAYER_MOVE, OPPONENT));

		expect(result.isRight()).toBe(true);
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects an unknown actor and keeps the combat intact', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration('missing-actor', PLAYER_MOVE, OPPONENT));

		expectRejected(result, { path: 'input.actorId', reason: 'invalid-input' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects an inactive actor and keeps the combat intact', () => {
		const combat = resolverCombatWithReserves();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration(RESERVE_PLAYER, PLAYER_MOVE, OPPONENT));

		expectRejected(result, { path: 'input.actorId', reason: 'rejected' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects an unknown Move and keeps the combat intact', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		// The binding exists so the declaration reaches catalog validation instead of failing at binding lookup.
		const result = declare(
			combat,
			declaration(PLAYER, 'missing-move', OPPONENT),
			bindings([PLAYER_MOVE, 'missing-move'])
		);

		expectRejected(result, { path: 'input.moveId', reason: 'invalid-input' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects a catalog Move the creature does not know and keeps the combat intact', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration(PLAYER, OPPONENT_MOVE, OPPONENT), bindings([OPPONENT_MOVE]));

		expectRejected(result, { path: 'input.moveId', reason: 'rejected' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects the actor itself as target and keeps the combat intact', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration(PLAYER, PLAYER_MOVE, PLAYER));

		expectRejected(result, { path: 'input.target.id', reason: 'invalid-target' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects an inactive opposing target and keeps the combat intact', () => {
		const combat = resolverCombatWithReserves();
		const before = combat.toPrimitives();
		const result = declare(combat, declaration(PLAYER, PLAYER_MOVE, RESERVE_OPPONENT));

		expectRejected(result, { path: 'input.target.id', reason: 'invalid-target' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('rejects an absent declaration and keeps the combat intact', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		const result = declare(combat, { actorId: PLAYER, target: { id: OPPONENT, scope: 'combatant' } });

		expectRejected(result, { path: 'input.moveId', reason: 'invalid-input' });
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('accepts a declaration from each active combatant without resolving the turn', () => {
		const combat = startCombat();
		const before = combat.toPrimitives();
		/*
		 * Phase 1 has no declaration set or turn service: each declaration is validated independently
		 * against the same unchanged combat and neither transition is applied.
		 */
		const player = declare(combat, declaration(PLAYER, PLAYER_MOVE, OPPONENT));
		const opponent = declare(combat, declaration(OPPONENT, OPPONENT_MOVE, PLAYER));

		expect(player.isRight()).toBe(true);
		expect(opponent.isRight()).toBe(true);
		expect(combat.toPrimitives()).toEqual(before);
	});
});
