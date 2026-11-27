import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatantGroupPrimitives, CombatantPrimitives, CombatPrimitives } from '@pocket-forge/combat/domain';
import type { DuelmonCombatStartError } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

type StartError = DuelmonCombatStartError;

type DeepMutable<T> = T extends readonly (infer U)[]
	? DeepMutable<U>[]
	: T extends object
		? { -readonly [K in keyof T]: DeepMutable<T[K]> }
		: T;

type MutableCombat = DeepMutable<CombatPrimitives>;

class CombatStartFixture {
	static attributes(primitives: MutableCombat, groupIndex = 0): DeepMutable<AttributeValues> {
		return this.combatant(primitives, groupIndex).attributes;
	}

	static combatant(
		primitives: MutableCombat,
		groupIndex: number,
		combatantIndex = 0
	): DeepMutable<CombatantPrimitives> {
		const value = this.group(primitives, groupIndex).combatants[combatantIndex];

		if (!value) {
			throw new Error(`Missing combatant at index ${String(combatantIndex)}`);
		}

		return value;
	}

	static errorsOf(primitives: MutableCombat): StartError[] {
		const result = this.start(primitives);

		expect(result.isLeft()).toBe(true);

		return result.getLeft();
	}

	static expectError(errors: StartError[], expected: { path?: string; reason: string }): void {
		const matches = errors.filter(
			error => error.reason === expected.reason && (expected.path === undefined || error.path === expected.path)
		);

		expect(matches.length).toBeGreaterThan(0);
	}

	static group(primitives: MutableCombat, index: number): DeepMutable<CombatantGroupPrimitives> {
		const value = primitives.groups[index];

		if (!value) {
			throw new Error(`Missing group at index ${String(index)}`);
		}

		return value;
	}

	static start(primitives: MutableCombat) {
		return DuelmonCombatStart.create(primitives, DuelmonCombatStartMother.DEFINITIONS);
	}

	static valid(): MutableCombat {
		return structuredClone(DuelmonCombatStartMother.primitives());
	}
}

describe('DuelmonCombatStart.create', () => {
	it('hydrates a valid initial state', () => {
		const primitives = CombatStartFixture.valid();
		const result = CombatStartFixture.start(primitives);

		expect(result.isRight()).toBe(true);
		expect(result.getRight().toPrimitives()).toEqual(primitives);
	});

	it('rejects a missing combat id', () => {
		const primitives = CombatStartFixture.valid();

		primitives.id = '';

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'id',
			reason: 'invalid-combat',
		});
	});

	it('rejects a combat that is not active', () => {
		const primitives = CombatStartFixture.valid();

		primitives.status = 'completed';

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'status',
			reason: 'invalid-combat',
		});
	});

	it('rejects an invalid random state', () => {
		const primitives = CombatStartFixture.valid();

		(primitives as { randomPocket?: unknown }).randomPocket = { seed: 1.5, state: 42 };

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'randomPocket',
			reason: 'invalid-random-pocket',
		});
	});

	it('rejects a combat without exactly two groups', () => {
		const primitives = CombatStartFixture.valid();

		primitives.groups.push(structuredClone(CombatStartFixture.group(primitives, 1)));

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups',
			reason: 'invalid-group-count',
		});
	});

	it('rejects a group without exactly one combatant', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.group(primitives, 1).combatants.push(
			structuredClone(CombatStartFixture.combatant(primitives, 0))
		);

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.1.combatants',
			reason: 'invalid-combatant-count',
		});
	});

	it('rejects duplicated group ids', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.group(primitives, 1).id = 'player';

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.1.id',
			reason: 'duplicate-id',
		});
	});

	it('rejects duplicated combatant ids', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 1).id = CombatStartFixture.combatant(primitives, 0).id;

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.1.combatants.0.id',
			reason: 'duplicate-id',
		});
	});

	it('rejects a combatant that belongs to another group', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 0).groupId = 'opponent';

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.groupId',
			reason: 'invalid-membership',
		});
	});

	it('rejects groups without exactly one active combatant', () => {
		const primitives = CombatStartFixture.valid();
		const groupAttributes = CombatStartFixture.group(primitives, 0).attributes;

		groupAttributes['activeCombatantIds'] = [];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});

		groupAttributes['activeCombatantIds'] = ['player-emberling', 'opponent-aquafin'];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});

		groupAttributes['activeCombatantIds'] = ['missing'];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});
	});

	it('rejects missing and out-of-range battle attributes', () => {
		const primitives = CombatStartFixture.valid();
		const combatantAttributes = CombatStartFixture.attributes(primitives);

		delete combatantAttributes['level'];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.level',
			reason: 'missing-attribute',
		});

		combatantAttributes['level'] = 0;
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.level',
			reason: 'invalid-attribute',
		});

		combatantAttributes['movePp'] = [];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.movePp',
			reason: 'invalid-attribute',
		});
	});

	it('rejects current hp outside its valid range', () => {
		const primitives = CombatStartFixture.valid();
		const combatantAttributes = CombatStartFixture.attributes(primitives);

		combatantAttributes['hp'] = 0;
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.hp',
			reason: 'invalid-hp',
		});

		combatantAttributes['hp'] = 105;
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.hp',
			reason: 'invalid-hp',
		});
	});

	it('rejects creatures without species or types', () => {
		const primitives = CombatStartFixture.valid();
		const first = CombatStartFixture.combatant(primitives, 0);
		const second = CombatStartFixture.combatant(primitives, 1);

		first.creature.species.id = '';
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.id',
			reason: 'missing-species',
		});

		second.creature.species.attributes['types'] = [];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.1.combatants.0.creature.species.attributes.types',
			reason: 'missing-types',
		});
	});

	it('rejects missing, oversized, and duplicated loadouts', () => {
		const primitives = CombatStartFixture.valid();
		const first = CombatStartFixture.combatant(primitives, 0);
		const [move] = first.creature.moves;

		if (!move) {
			throw new Error('Missing fixture move');
		}

		first.creature.moves = [];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'missing-moves',
		});

		first.creature.moves = Array.from({ length: 5 }, (_, index) => ({ ...move, id: `move-${String(index)}` }));
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'invalid-moves',
		});

		first.creature.moves = [move, { ...move }];
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'invalid-moves',
		});
	});

	it('rejects species snapshots without their base stats', () => {
		const primitives = CombatStartFixture.valid();

		delete CombatStartFixture.combatant(primitives, 0).creature.species.attributes['baseHp'];

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.attributes.baseHp',
			reason: 'missing-attribute',
		});
	});

	it('rejects species snapshots with invalid base stats', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 0).creature.species.attributes['baseHp'] = 0;

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.attributes.baseHp',
			reason: 'invalid-attribute',
		});
	});

	it('rejects move snapshots without their attributes', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 0).creature.moves = [
			{
				attributes: {
					alwaysHits: true,
					category: 'Status',
					power: 0,
					pp: 30,
					priority: 0,
					type: 'Normal',
				},
				id: 'oath',
			},
		] as never;

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0.attributes.accuracy',
			reason: 'missing-attribute',
		});
	});

	it('rejects move snapshots outside the Phase 1 slice', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 0).creature.moves = [
			{
				attributes: {
					accuracy: 100,
					alwaysHits: true,
					category: 'Status',
					power: 0,
					pp: 30,
					priority: 0,
					type: 'Normal',
				},
				id: 'oath',
			},
		] as never;

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0',
			reason: 'unsupported-move',
		});
	});

	it('rejects move snapshots with unsupported flags', () => {
		const primitives = CombatStartFixture.valid();
		const move = CombatStartFixture.combatant(primitives, 0).creature.moves[0];

		if (!move) {
			throw new Error('Missing fixture move');
		}

		CombatStartFixture.combatant(primitives, 0).creature.moves = [
			{ ...move, attributes: { ...move.attributes, flags: [{ name: 'charge', value: 1 }] } },
		];

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0',
			reason: 'unsupported-move',
		});
	});

	it('rejects combat and creature attributes outside Phase 1', () => {
		const primitives = CombatStartFixture.valid();
		const first = CombatStartFixture.combatant(primitives, 0);

		primitives.attributes = { power: 5 };
		first.creature.attributes = { power: 5 };
		first.creature.abilities = [{}] as never;

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'attributes.power',
			reason: 'invalid-attribute',
		});
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.attributes.power',
			reason: 'invalid-attribute',
		});
		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.abilities',
			reason: 'invalid-combat',
		});
	});

	it('rejects a creature without an id', () => {
		const primitives = CombatStartFixture.valid();

		CombatStartFixture.combatant(primitives, 0).creature.id = '';

		CombatStartFixture.expectError(CombatStartFixture.errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.id',
			reason: 'missing-id',
		});
	});

	it('aggregates every violation instead of stopping at the first', () => {
		const primitives = CombatStartFixture.valid();
		const first = CombatStartFixture.combatant(primitives, 0);

		delete CombatStartFixture.attributes(primitives)['level'];
		CombatStartFixture.attributes(primitives)['hp'] = 0;
		first.groupId = 'missing';

		const errors = CombatStartFixture.errorsOf(primitives);

		expect(errors.length).toBeGreaterThanOrEqual(3);
		CombatStartFixture.expectError(errors, { reason: 'missing-attribute' });
		CombatStartFixture.expectError(errors, { reason: 'invalid-hp' });
		CombatStartFixture.expectError(errors, { reason: 'invalid-membership' });
	});
});
