import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import { DuelmonCombatInput, DuelmonTarget, DuelmonTurnDeclaration } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const ACTOR_ID = 'combatant-a';
const TARGET_ID = 'combatant-b';
const THIRD_ID = 'combatant-c';

function validate(combat: Combat, actorId = ACTOR_ID, moveId = 'ember-burst', targetId = TARGET_ID) {
	return DuelmonTurnDeclaration.validate(
		DuelmonCombatMother.catalog(),
		combat,
		DuelmonCombatInput.create(actorId, moveId, DuelmonTarget.create('combatant', targetId))
	);
}

function combatWithThirdGroup(): Combat {
	const primitives: CombatPrimitives = structuredClone(DuelmonCombatMother.useMoveCombat().toPrimitives());
	const [firstGroup] = primitives.groups;

	if (!firstGroup) {
		throw new Error('Missing first group');
	}

	const thirdGroup = {
		...structuredClone(firstGroup),
		attributes: { activeCombatantIds: [THIRD_ID] },
		combatants: firstGroup.combatants.map(combatant => ({
			...combatant,
			groupId: 'group-c',
			id: THIRD_ID,
		})),
		id: 'group-c',
	};

	return CombatEntity.fromPrimitives({ ...primitives, groups: [...primitives.groups, thirdGroup] });
}

describe('DuelmonTurnDeclaration', () => {
	it('returns the validated actor, Move, target, and write path', () => {
		const result = validate(DuelmonCombatMother.useMoveCombat());

		expect(result.isRight()).toBe(true);

		const declaration = result.getRight();

		expect(declaration.actor.id).toBe(ACTOR_ID);
		expect(declaration.move.id).toBe('ember-burst');
		expect(declaration.moveId).toBe('ember-burst');
		expect(declaration.target.id).toBe(TARGET_ID);
		expect(declaration.resolvedTarget.combatant?.id).toBe(TARGET_ID);
	});

	it('rejects a target from the actor group', () => {
		const result = validate(DuelmonCombatMother.useMoveCombat(), ACTOR_ID, 'ember-burst', ACTOR_ID);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(result.getLeft()[0]?.path).toBe('input.target.id');
	});

	it('rejects an active target from a third group', () => {
		const result = validate(combatWithThirdGroup(), ACTOR_ID, 'ember-burst', THIRD_ID);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(result.getLeft()[0]?.path).toBe('input.target.id');
	});

	it('rejects a non-combatant target scope', () => {
		const result = DuelmonTurnDeclaration.validate(
			DuelmonCombatMother.catalog(),
			DuelmonCombatMother.useMoveCombat(),
			DuelmonCombatInput.create(ACTOR_ID, 'ember-burst', DuelmonTarget.create('combat'))
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-target');
		expect(result.getLeft()[0]?.path).toBe('input.target.scope');
	});
});
