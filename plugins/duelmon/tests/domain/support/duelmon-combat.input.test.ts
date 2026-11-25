import { DuelmonCombatInput } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const DECLARATION = {
	actorId: 'player-emberling',
	moveId: 'ember-burst',
	target: { id: 'opponent-aquafin', scope: 'combatant' },
} as const;

function parse(value: unknown) {
	return DuelmonCombatInput.parse(value);
}

describe('DuelmonCombatInput', () => {
	it('parses one actor, one move, and one Phase 1 target', () => {
		const result = parse(DECLARATION);

		expect(result.isRight()).toBe(true);

		const declaration = result.getRight();

		expect(declaration.actorId).toBe('player-emberling');
		expect(declaration.moveId).toBe('ember-burst');
		expect(declaration.target.scope).toBe('combatant');
		expect(declaration.target.id).toBe('opponent-aquafin');
	});

	it('exposes only the declaration fields', () => {
		const result = parse({
			...DECLARATION,
			flee: true,
			item: 'potion',
			moveIds: ['ember-burst', 'tackle'],
			pp: 5,
			switch: 'opponent-aquafin',
		});

		expect(result.isRight()).toBe(true);
		expect(Object.keys(result.getRight()).toSorted((left, right) => left.localeCompare(right))).toEqual([
			'actorId',
			'moveId',
			'target',
		]);
	});

	it('rejects a declaration without a move instead of choosing a default', () => {
		const result = parse({ actorId: DECLARATION.actorId, target: DECLARATION.target });

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-input');
		expect(result.getLeft()[0]?.path).toBe('input.moveId');
	});

	it('rejects a declaration that carries only a move list', () => {
		const result = parse({
			actorId: DECLARATION.actorId,
			moveIds: ['ember-burst', 'tackle'],
			target: DECLARATION.target,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-input');
		expect(result.getLeft()[0]?.path).toBe('input.moveId');
	});

	it('rejects an empty move id', () => {
		const result = parse({ ...DECLARATION, moveId: ' ' });

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-input');
		expect(result.getLeft()[0]?.path).toBe('input.moveId');
	});

	it('rejects a declaration without an actor or target', () => {
		const withoutActor = parse({ moveId: DECLARATION.moveId, target: DECLARATION.target });
		const withoutTarget = parse({ actorId: DECLARATION.actorId, moveId: DECLARATION.moveId });

		expect(withoutActor.getLeft()[0]?.path).toBe('input.actorId');
		expect(withoutTarget.getLeft()[0]?.path).toBe('input.target');
	});

	it('does not mutate the declaration or the combat', () => {
		const combat = DuelmonCombatStartMother.combat();
		const before = combat.toPrimitives();
		const value = { ...DECLARATION, target: { ...DECLARATION.target } };

		expect(parse(value).isRight()).toBe(true);
		expect(value).toEqual(DECLARATION);
		expect(combat.toPrimitives()).toEqual(before);
	});

	it('does not add pending or confirmed state to the combat', () => {
		const combat = DuelmonCombatStartMother.combat();
		const before = combat.toPrimitives();

		expect(parse(DECLARATION).isRight()).toBe(true);
		expect('pending' in before).toBe(false);
		expect('confirmed' in before).toBe(false);
		expect(combat.toPrimitives()).toEqual(before);
	});
});
