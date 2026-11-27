import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatantPrimitives, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat } from '@pocket-forge/combat/domain';
import { DuelmonCombatant } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

function firstCombatant(primitives: CombatPrimitives): CombatantPrimitives {
	const group = primitives.groups[0];
	const combatant = group?.combatants[0];

	if (!combatant) {
		throw new Error('Missing fixture combatant');
	}

	return combatant;
}

function view(primitives: CombatPrimitives = DuelmonCombatStartMother.primitives()): DuelmonCombatant {
	const combat = Combat.fromPrimitives(primitives);
	const combatant = combat.groups[0]?.combatants[0];

	if (!combatant) {
		throw new Error('Missing fixture combatant');
	}

	return DuelmonCombatant.fromCombatant(combatant);
}

function withAttributes(attributes: AttributeValues): CombatPrimitives {
	const primitives = DuelmonCombatStartMother.primitives();
	const [first, second] = primitives.groups;

	if (!first || !second) {
		throw new Error('Fixture requires two groups');
	}

	return {
		...primitives,
		groups: [{ ...first, combatants: [{ ...firstCombatant(primitives), attributes }] }, second],
	};
}

describe('DuelmonCombatant', () => {
	it('exposes the battle attributes as typed getters', () => {
		const combatant = view();

		expect(combatant.id).toBe('player-emberling');
		expect(combatant.groupId).toBe('player');
		expect(combatant.level).toBe(50);
		expect(combatant.hp).toBe(99);
		expect(combatant.maxHp).toBe(99);
		expect(combatant.attack).toBe(57);
		expect(combatant.defense).toBe(48);
		expect(combatant.special).toBe(65);
		expect(combatant.speed).toBe(70);
		expect(combatant.isFainted).toBe(false);
	});

	it('exposes the embedded species and loadout moves', () => {
		const combatant = view();

		expect(combatant.species().types).toEqual(['Fire']);
		expect(combatant.moves().map(move => move.id)).toEqual(['ember-burst', 'tackle']);
	});

	it('reports a fainted combatant', () => {
		const primitives = DuelmonCombatStartMother.primitives();
		const attributes = { ...firstCombatant(primitives).attributes, hp: 0 };

		expect(view(withAttributes(attributes)).isFainted).toBe(true);
	});

	it('throws when a battle attribute is missing', () => {
		const primitives = DuelmonCombatStartMother.primitives();
		const attributes = { ...firstCombatant(primitives).attributes };

		delete attributes['attack'];

		expect(() => view(withAttributes(attributes)).attack).toThrow();
	});
});
