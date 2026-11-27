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

class TurnDeclarationsFixture {
	static basePrimitives(): CombatPrimitives {
		return structuredClone(DuelmonCombatStartMother.combat().toPrimitives());
	}

	static combat(): Combat {
		return DuelmonCombatStartMother.combat();
	}

	static combatWithKnownMoves(combatantId: string, moveIds: readonly string[]): Combat {
		const primitives = this.basePrimitives();
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

	static combatWithNoActiveCombatants(): Combat {
		const primitives = this.basePrimitives();
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

	static combatWithReserve(): Combat {
		const primitives = this.basePrimitives();
		const playerGroup = primitives.groups[0];
		const player = playerGroup?.combatants[0];

		if (!playerGroup || !player) {
			throw new Error('Fixture is missing the player combatant');
		}

		primitives.groups[0] = {
			...playerGroup,
			combatants: [...playerGroup.combatants, this.reserveCombatant('player', RESERVE, player)],
		};

		return CombatEntity.fromPrimitives(primitives);
	}

	static combatWithReversedGroups(): Combat {
		const primitives = this.basePrimitives();

		primitives.groups.reverse();

		return CombatEntity.fromPrimitives(primitives);
	}

	static combatWithSingleGroup(): Combat {
		const primitives = this.basePrimitives();
		const [playerGroup] = primitives.groups;

		if (!playerGroup) {
			throw new Error('Fixture is missing the player group');
		}

		return CombatEntity.fromPrimitives({ ...primitives, groups: [playerGroup] });
	}

	static combatWithThirdGroup(): Combat {
		const primitives = this.basePrimitives();
		const playerGroup = primitives.groups[0];
		const player = playerGroup?.combatants[0];

		if (!playerGroup || !player) {
			throw new Error('Fixture is missing the player combatant');
		}

		primitives.groups.push({
			...structuredClone(playerGroup),
			attributes: { activeCombatantIds: [THIRD] },
			combatants: [this.reserveCombatant('third', THIRD, player)],
			id: 'third',
		});

		return CombatEntity.fromPrimitives(primitives);
	}

	static combatWithTwoActiveCombatants(): Combat {
		const primitives = this.basePrimitives();
		const playerGroup = primitives.groups[0];
		const player = playerGroup?.combatants[0];

		if (!playerGroup || !player) {
			throw new Error('Fixture is missing the player combatant');
		}

		primitives.groups[0] = {
			...playerGroup,
			attributes: { ...playerGroup.attributes, activeCombatantIds: [PLAYER, RESERVE] },
			combatants: [...playerGroup.combatants, this.reserveCombatant('player', RESERVE, player)],
		};

		return CombatEntity.fromPrimitives(primitives);
	}

	static declaration(actorId: string, moveId: string, targetId: string): unknown {
		return { actorId, moveId, target: { id: targetId, scope: 'combatant' } };
	}

	static expectRejected(
		result: ReceiveResult,
		expected: { path: string; reason: CombatResolutionErrorReason }
	): void {
		expect(result.isLeft()).toBe(true);

		const errors = result.getLeft();

		expect(errors.some(error => error.path === expected.path && error.reason === expected.reason)).toBe(true);
	}

	static receive(combatSnapshot: Combat, declarations: unknown): ReceiveResult {
		return DuelmonTurnDeclarations.receive(DuelmonCombatStartMother.catalog(), combatSnapshot, declarations);
	}

	static reserveCombatant(groupId: string, id: string, source: CombatantPrimitives): CombatantPrimitives {
		return {
			...structuredClone(source),
			creature: { ...structuredClone(source.creature), id: `${id}-creature` },
			groupId,
			id,
		};
	}

	static validDeclarations(): readonly unknown[] {
		return [this.declaration(PLAYER, PLAYER_MOVE, OPPONENT), this.declaration(OPPONENT, OPPONENT_MOVE, PLAYER)];
	}
}

describe('DuelmonTurnDeclarations', () => {
	it('accepts one valid declaration per group in both input orders', () => {
		const forward = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combat(),
			TurnDeclarationsFixture.validDeclarations()
		);
		const reversed = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combat(),
			TurnDeclarationsFixture.validDeclarations().toReversed()
		);

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
		const declarations = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combat(),
			TurnDeclarationsFixture.validDeclarations()
		).getRight();

		expect(declarations.declarationForGroup('player')?.actor.id).toBe(PLAYER);
		expect(declarations.declarationForGroup('opponent')?.actor.id).toBe(OPPONENT);
		expect(declarations.declarationForActor(PLAYER)?.moveId).toBe(PLAYER_MOVE);
		expect(declarations.declarationForActor(OPPONENT)?.moveId).toBe(OPPONENT_MOVE);
		expect(declarations.declarationForActor('missing-actor')).toBeUndefined();
	});

	it('orders the declarations by the combat, not by the input', () => {
		const declarations = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]).getRight();

		expect(declarations.declarations().map(declaration => declaration.actor.id)).toEqual([PLAYER, OPPONENT]);
	});

	it('follows the group order of the combat', () => {
		const declarations = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combatWithReversedGroups(),
			TurnDeclarationsFixture.validDeclarations()
		).getRight();

		expect(declarations.declarations().map(declaration => declaration.actor.id)).toEqual([OPPONENT, PLAYER]);
	});

	it('rejects an absent declaration list', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), undefined);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(result.getLeft()).toHaveLength(1);
	});

	it('rejects an empty declaration list', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), []);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
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
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
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
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			undefined,
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations.1.input', reason: 'invalid-input' });
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "opponent"')).toBe(true);
	});

	it('rejects a declaration list that is not an array', () => {
		for (const input of [{ actorId: PLAYER }, 'declarations']) {
			const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), input);

			TurnDeclarationsFixture.expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
			expect(result.getLeft()).toHaveLength(1);
			expect(result.getLeft()[0]?.message).toBe('A Phase 1 turn requires one declaration per group');
		}
	});

	it('rejects a list with three declarations', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
			TurnDeclarationsFixture.declaration(PLAYER, 'tackle', OPPONENT),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations', reason: 'invalid-input' });
		expect(
			result
				.getLeft()
				.some(
					error => error.message === 'A Phase 1 turn requires exactly one declaration per group, received 3'
				)
		).toBe(true);
		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.2.input.actorId',
			reason: 'invalid-input',
		});
	});

	it('aggregates failures from both declarations in one pass', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, 'missing-move', OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, 'missing-move', PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.0.input.moveId',
			reason: 'invalid-input',
		});
		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.1.input.moveId',
			reason: 'invalid-input',
		});
	});

	it('rejects a duplicated declaration for the same actor', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.1.input.actorId',
			reason: 'invalid-input',
		});
		expect(result.getLeft().some(error => error.message.includes('Duplicate declaration for actor'))).toBe(true);
	});

	it('rejects an unknown actor', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration('missing-actor', PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.0.input.actorId',
			reason: 'invalid-input',
		});
	});

	it('rejects an inactive actor', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combatWithReserve(), [
			TurnDeclarationsFixture.declaration(RESERVE, PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations.0.input.actorId', reason: 'rejected' });
	});

	it('rejects an unknown Move', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, 'missing-move', OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.0.input.moveId',
			reason: 'invalid-input',
		});
	});

	it('rejects a catalog Move the creature does not know', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, OPPONENT_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
	});

	it('rejects a Status Move at the turn boundary with the Phase 1 policy', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combatWithKnownMoves(PLAYER, ['oath']), [
			TurnDeclarationsFixture.declaration(PLAYER, 'oath', OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
		expect(
			result.getLeft().some(error => error.message === 'Move "oath" is a Status move, which is outside Phase 1')
		).toBe(true);
		expect(result.getLeft().some(error => error.message === 'Missing declaration for group "player"')).toBe(true);
	});

	it('rejects a non-zero priority Move at the turn boundary with the Phase 1 policy', () => {
		const result = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combatWithKnownMoves(PLAYER, ['quick-jab']),
			[
				TurnDeclarationsFixture.declaration(PLAYER, 'quick-jab', OPPONENT),
				TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
			]
		);

		TurnDeclarationsFixture.expectRejected(result, { path: 'declarations.0.input.moveId', reason: 'rejected' });
		expect(
			result
				.getLeft()
				.some(error => error.message === 'Move "quick-jab" has non-zero priority, which is outside Phase 1')
		).toBe(true);
	});

	it('still accepts a supported Move added to the creature loadout', () => {
		const result = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combatWithKnownMoves(PLAYER, [PLAYER_MOVE]),
			TurnDeclarationsFixture.validDeclarations()
		);

		expect(result.isRight()).toBe(true);
	});

	it('rejects a target from the actor group', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, PLAYER),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.0.input.target.id',
			reason: 'invalid-target',
		});
	});

	it('rejects a target outside the Phase 1 combatant scope', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combat(), [
			{ actorId: PLAYER, moveId: PLAYER_MOVE, target: { id: 'opponent', scope: 'group' } },
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'declarations.0.input.target.scope',
			reason: 'invalid-target',
		});
	});

	it('rejects a combat with more than two groups', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combatWithThirdGroup(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'combat.groups', reason: 'incompatible-contract' });
	});

	it('rejects a combat with a single group', () => {
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combatWithSingleGroup(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		TurnDeclarationsFixture.expectRejected(result, { path: 'combat.groups', reason: 'incompatible-contract' });
		expect(
			result.getLeft().some(error => error.message === 'Phase 1 requires exactly two groups, received 1')
		).toBe(true);
	});

	it('rejects a group with no active combatant', () => {
		const result = TurnDeclarationsFixture.receive(
			TurnDeclarationsFixture.combatWithNoActiveCombatants(),
			TurnDeclarationsFixture.validDeclarations()
		);

		TurnDeclarationsFixture.expectRejected(result, {
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
		const result = TurnDeclarationsFixture.receive(TurnDeclarationsFixture.combatWithTwoActiveCombatants(), [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
			TurnDeclarationsFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
		]);

		TurnDeclarationsFixture.expectRejected(result, {
			path: 'combat.groups.0.attributes.activeCombatantIds',
			reason: 'incompatible-contract',
		});
	});

	it('does not change the combat or resolve anything when both declarations are valid', () => {
		const combatSnapshot = TurnDeclarationsFixture.combat();
		const before = combatSnapshot.toPrimitives();
		const result = TurnDeclarationsFixture.receive(combatSnapshot, TurnDeclarationsFixture.validDeclarations());

		expect(result.isRight()).toBe(true);
		expect(combatSnapshot.toPrimitives()).toEqual(before);
	});

	it('does not change the combat when a declaration is rejected', () => {
		const combatSnapshot = TurnDeclarationsFixture.combat();
		const before = combatSnapshot.toPrimitives();
		const result = TurnDeclarationsFixture.receive(combatSnapshot, [
			TurnDeclarationsFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		expect(result.isLeft()).toBe(true);
		expect(combatSnapshot.toPrimitives()).toEqual(before);
	});
});
