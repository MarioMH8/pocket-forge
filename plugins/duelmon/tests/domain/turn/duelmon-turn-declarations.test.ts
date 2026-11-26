import type { Combat, CombatantPrimitives, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { CombatResolutionErrorReason } from '@pocket-forge/combat-engine/domain';
import { DuelmonTurnDeclarations } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';
const RESERVE = 'player-reserve';
const THIRD = 'third-emberling';

type ReceiveResult = ReturnType<typeof DuelmonTurnDeclarations.receive>;

function combat(): Combat {
	return DuelmonCombatStartMother.combat();
}

function receive(combatSnapshot: Combat, declarations: unknown): ReceiveResult {
	return DuelmonTurnDeclarations.receive(DuelmonCombatStartMother.catalog(), combatSnapshot, declarations);
}

function declaration(actorId: string, moveId: string, targetId: string): unknown {
	return { actorId, moveId, target: { id: targetId, scope: 'combatant' } };
}

function validDeclarations(): readonly unknown[] {
	return [declaration(PLAYER, PLAYER_MOVE, OPPONENT), declaration(OPPONENT, OPPONENT_MOVE, PLAYER)];
}

function expectRejected(result: ReceiveResult, expected: { path: string; reason: CombatResolutionErrorReason }): void {
	expect(result.isLeft()).toBe(true);

	const errors = result.getLeft();

	expect(errors.some(error => error.path === expected.path && error.reason === expected.reason)).toBe(true);
}

function basePrimitives(): CombatPrimitives {
	return structuredClone(DuelmonCombatStartMother.combat().toPrimitives());
}

function reserveCombatant(groupId: string, id: string, source: CombatantPrimitives): CombatantPrimitives {
	return {
		...structuredClone(source),
		creature: { ...structuredClone(source.creature), id: `${id}-creature` },
		groupId,
		id,
	};
}

function combatWithReserve(): Combat {
	const primitives = basePrimitives();
	const playerGroup = primitives.groups[0];
	const player = playerGroup?.combatants[0];

	if (!playerGroup || !player) {
		throw new Error('Fixture is missing the player combatant');
	}

	primitives.groups[0] = {
		...playerGroup,
		combatants: [...playerGroup.combatants, reserveCombatant('player', RESERVE, player)],
	};

	return CombatEntity.fromPrimitives(primitives);
}

function combatWithTwoActiveCombatants(): Combat {
	const primitives = basePrimitives();
	const playerGroup = primitives.groups[0];
	const player = playerGroup?.combatants[0];

	if (!playerGroup || !player) {
		throw new Error('Fixture is missing the player combatant');
	}

	primitives.groups[0] = {
		...playerGroup,
		attributes: { ...playerGroup.attributes, activeCombatantIds: [PLAYER, RESERVE] },
		combatants: [...playerGroup.combatants, reserveCombatant('player', RESERVE, player)],
	};

	return CombatEntity.fromPrimitives(primitives);
}

function combatWithThirdGroup(): Combat {
	const primitives = basePrimitives();
	const playerGroup = primitives.groups[0];
	const player = playerGroup?.combatants[0];

	if (!playerGroup || !player) {
		throw new Error('Fixture is missing the player combatant');
	}

	primitives.groups.push({
		...structuredClone(playerGroup),
		attributes: { activeCombatantIds: [THIRD] },
		combatants: [reserveCombatant('third', THIRD, player)],
		id: 'third',
	});

	return CombatEntity.fromPrimitives(primitives);
}

function combatWithReversedGroups(): Combat {
	const primitives = basePrimitives();

	primitives.groups.reverse();

	return CombatEntity.fromPrimitives(primitives);
}

function combatWithSingleGroup(): Combat {
	const primitives = basePrimitives();
	const [playerGroup] = primitives.groups;

	if (!playerGroup) {
		throw new Error('Fixture is missing the player group');
	}

	return CombatEntity.fromPrimitives({ ...primitives, groups: [playerGroup] });
}

function combatWithNoActiveCombatants(): Combat {
	const primitives = basePrimitives();
	const playerGroup = primitives.groups[0];

	if (!playerGroup) {
		throw new Error('Fixture is missing the player group');
	}

	primitives.groups[0] = {
		...playerGroup,
		attributes: { ...playerGroup.attributes, activeCombatantIds: [] },
	};

	return CombatEntity.fromPrimitives(primitives);
}

function combatWithKnownMoves(combatantId: string, moveIds: readonly string[]): Combat {
	const primitives = basePrimitives();
	const catalog = DuelmonCombatStartMother.catalog();
	const moves = moveIds.map(moveId => {
		const move = catalog.findMove(moveId);

		if (!move) {
			throw new Error(`Fixture is missing the move "${moveId}"`);
		}

		return move.toPrimitives();
	});

	return CombatEntity.fromPrimitives({
		...primitives,
		groups: primitives.groups.map(group => ({
			...group,
			combatants: group.combatants.map(combatant =>
				combatant.id === combatantId
					? {
							...combatant,
							creature: { ...combatant.creature, moves: [...combatant.creature.moves, ...moves] },
						}
					: combatant
			),
		})),
	});
}

describe('DuelmonTurnDeclarations', () => {
	it('accepts one valid declaration per group in both input orders', () => {
		const forward = receive(combat(), validDeclarations());
		const reversed = receive(combat(), validDeclarations().toReversed());

		expect(forward.isRight()).toBe(true);
		expect(reversed.isRight()).toBe(true);
		expect(
			forward
				.getRight()
				.declarations()
				.map(declaration => declaration.actor.id)
		).toEqual([PLAYER, OPPONENT]);
		expect(
			reversed
				.getRight()
				.declarations()
				.map(declaration => declaration.actor.id)
		).toEqual([PLAYER, OPPONENT]);
	});

	it('finds declarations by group and actor', () => {
		const declarations = receive(combat(), validDeclarations()).getRight();

		expect(declarations.declarationForGroup('player')?.actor.id).toBe(PLAYER);
		expect(declarations.declarationForGroup('opponent')?.actor.id).toBe(OPPONENT);
		expect(declarations.declarationForActor(PLAYER)?.moveId).toBe(PLAYER_MOVE);
		expect(declarations.declarationForActor(OPPONENT)?.moveId).toBe(OPPONENT_MOVE);
		expect(declarations.declarationForActor('missing-actor')).toBeUndefined();
	});

	it('orders the declarations by the combat, not by the input', () => {
		const declarations = receive(combat(), [
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]).getRight();

		expect(declarations.declarations().map(declaration => declaration.actor.id)).toEqual([PLAYER, OPPONENT]);
	});

	it('follows the group order of the combat', () => {
		const declarations = receive(combatWithReversedGroups(), validDeclarations()).getRight();

		expect(declarations.declarations().map(declaration => declaration.actor.id)).toEqual([OPPONENT, PLAYER]);
	});

	it('rejects an absent declaration list', () => {
		const result = receive(combat(), undefined);

		expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(result.getLeft()).toHaveLength(1);
	});

	it('rejects an empty declaration list', () => {
		const result = receive(combat(), []);

		expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(
			result
				.getLeft()
				.some(
					error => error.message === 'A Phase 1 turn requires exactly one declaration per group, received 0'
				)
		).toBe(true);
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "player"')).toBe(true);
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "opponent"')).toBe(true);
	});

	it('rejects a list with a single declaration', () => {
		const result = receive(combat(), [declaration(PLAYER, PLAYER_MOVE, OPPONENT)]);

		expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(
			result
				.getLeft()
				.some(
					error => error.message === 'A Phase 1 turn requires exactly one declaration per group, received 1'
				)
		).toBe(true);
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "opponent"')).toBe(true);
	});

	it('rejects an absent entry in the declaration list', () => {
		const result = receive(combat(), [declaration(PLAYER, PLAYER_MOVE, OPPONENT), undefined]);

		expectRejected(result, { path: 'declarations.1.input', reason: 'invalid-input' });
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "opponent"')).toBe(true);
	});

	it('rejects a declaration list that is not an array', () => {
		for (const input of [{ actorId: PLAYER }, 'declarations']) {
			const result = receive(combat(), input);

			expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
			expect(result.getLeft()).toHaveLength(1);
			expect(result.getLeft()[0]?.message).toBe('A Phase 1 turn requires one declaration per group');
		}
	});

	it('rejects a list with three declarations', () => {
		const result = receive(combat(), [
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
			declaration(PLAYER, 'tackle', OPPONENT),
		]);

		expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(
			result
				.getLeft()
				.some(
					error => error.message === 'A Phase 1 turn requires exactly one declaration per group, received 3'
				)
		).toBe(true);
		expectRejected(result, { path: 'declarations.2.input.actorId', reason: 'invalid-input' });
	});

	it('aggregates failures from both declarations in one pass', () => {
		const result = receive(combat(), [
			declaration(PLAYER, 'missing-move', OPPONENT),
			declaration(OPPONENT, 'missing-move', PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'invalid-input' });
		expectRejected(result, { path: 'declarations.1.input.moveId', reason: 'invalid-input' });
	});

	it('rejects a duplicated declaration for the same actor', () => {
		const result = receive(combat(), [
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		expectRejected(result, { path: 'declarations.1.input.actorId', reason: 'invalid-input' });
		expect(result.getLeft().some(error => error.message.includes('Duplicate declaration for actor'))).toBe(true);
	});

	it('rejects an unknown actor', () => {
		const result = receive(combat(), [
			declaration('missing-actor', PLAYER_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.actorId', reason: 'invalid-input' });
	});

	it('rejects an inactive actor', () => {
		const result = receive(combatWithReserve(), [
			declaration(RESERVE, PLAYER_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.actorId', reason: 'rejected' });
	});

	it('rejects an unknown Move', () => {
		const result = receive(combat(), [
			declaration(PLAYER, 'missing-move', OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'invalid-input' });
	});

	it('rejects a catalog Move the creature does not know', () => {
		const result = receive(combat(), [
			declaration(PLAYER, OPPONENT_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
	});

	it('rejects a Status Move at the turn boundary with the Phase 1 policy', () => {
		const result = receive(combatWithKnownMoves(PLAYER, ['oath']), [
			declaration(PLAYER, 'oath', OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
		expect(
			result.getLeft().some(error => error.message === 'Move "oath" is a Status move, which is outside Phase 1')
		).toBe(true);
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "player"')).toBe(true);
	});

	it('rejects a non-zero priority Move at the turn boundary with the Phase 1 policy', () => {
		const result = receive(combatWithKnownMoves(PLAYER, ['quick-jab']), [
			declaration(PLAYER, 'quick-jab', OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
		expect(
			result
				.getLeft()
				.some(error => error.message === 'Move "quick-jab" has non-zero priority, which is outside Phase 1')
		).toBe(true);
	});

	it('still accepts a supported Move added to the creature loadout', () => {
		const result = receive(combatWithKnownMoves(PLAYER, [PLAYER_MOVE]), validDeclarations());

		expect(result.isRight()).toBe(true);
	});

	it('rejects a target from the actor group', () => {
		const result = receive(combat(), [
			declaration(PLAYER, PLAYER_MOVE, PLAYER),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.target.id', reason: 'invalid-target' });
	});

	it('rejects a target outside the Phase 1 combatant scope', () => {
		const result = receive(combat(), [
			{ actorId: PLAYER, moveId: PLAYER_MOVE, target: { id: 'opponent', scope: 'group' } },
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'declarations.0.input.target.scope', reason: 'invalid-target' });
	});

	it('rejects a combat with more than two groups', () => {
		const result = receive(combatWithThirdGroup(), [
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, { path: 'combat.groups', reason: 'incompatible-contract' });
	});

	it('rejects a combat with a single group', () => {
		const result = receive(combatWithSingleGroup(), [declaration(PLAYER, PLAYER_MOVE, OPPONENT)]);

		expectRejected(result, { path: 'combat.groups', reason: 'incompatible-contract' });
		expect(
			result.getLeft().some(error => error.message === 'Phase 1 requires exactly two groups, received 1')
		).toBe(true);
	});

	it('rejects a group with no active combatant', () => {
		const result = receive(combatWithNoActiveCombatants(), validDeclarations());

		expectRejected(result, {
			path: 'combat.groups.0.attributes.activeCombatantIds',
			reason: 'incompatible-contract',
		});
		expect(
			result
				.getLeft()
				.some(
					error =>
						error.message === 'Phase 1 group "player" requires exactly one active combatant, received 0'
				)
		).toBe(true);
	});

	it('rejects a combat with two active combatants in a group', () => {
		const result = receive(combatWithTwoActiveCombatants(), [
			declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		expectRejected(result, {
			path: 'combat.groups.0.attributes.activeCombatantIds',
			reason: 'incompatible-contract',
		});
	});

	it('does not change the combat or resolve anything when both declarations are valid', () => {
		const combatSnapshot = combat();
		const before = combatSnapshot.toPrimitives();
		const result = receive(combatSnapshot, validDeclarations());

		expect(result.isRight()).toBe(true);
		expect(combatSnapshot.toPrimitives()).toEqual(before);
	});

	it('does not change the combat when a declaration is rejected', () => {
		const combatSnapshot = combat();
		const before = combatSnapshot.toPrimitives();
		const result = receive(combatSnapshot, [declaration(PLAYER, PLAYER_MOVE, OPPONENT)]);

		expect(result.isLeft()).toBe(true);
		expect(combatSnapshot.toPrimitives()).toEqual(before);
	});
});
