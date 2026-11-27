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

function valid(): MutableCombat {
	return structuredClone(DuelmonCombatStartMother.primitives());
}

function group(primitives: MutableCombat, index: number): DeepMutable<CombatantGroupPrimitives> {
	const value = primitives.groups[index];

	if (!value) {
		throw new Error(`Missing group at index ${String(index)}`);
	}

	return value;
}

function combatant(
	primitives: MutableCombat,
	groupIndex: number,
	combatantIndex = 0
): DeepMutable<CombatantPrimitives> {
	const value = group(primitives, groupIndex).combatants[combatantIndex];

	if (!value) {
		throw new Error(`Missing combatant at index ${String(combatantIndex)}`);
	}

	return value;
}

function attributes(primitives: MutableCombat, groupIndex = 0): DeepMutable<AttributeValues> {
	return combatant(primitives, groupIndex).attributes;
}

function start(primitives: MutableCombat) {
	return DuelmonCombatStart.create(primitives, DuelmonCombatStartMother.DEFINITIONS);
}

function errorsOf(primitives: MutableCombat): StartError[] {
	const result = start(primitives);

	expect(result.isLeft()).toBe(true);

	return result.getLeft();
}

function expectError(errors: StartError[], expected: { path?: string; reason: string }): void {
	const matches = errors.filter(
		error => error.reason === expected.reason && (expected.path === undefined || error.path === expected.path)
	);

	expect(matches.length).toBeGreaterThan(0);
}

describe('DuelmonCombatStart.create', () => {
	it('hydrates a valid initial state', () => {
		const primitives = valid();
		const result = start(primitives);

		expect(result.isRight()).toBe(true);
		expect(result.getRight().toPrimitives()).toEqual(primitives);
	});

	it('rejects a missing combat id', () => {
		const primitives = valid();

		primitives.id = '';

		expectError(errorsOf(primitives), { path: 'id', reason: 'invalid-combat' });
	});

	it('rejects a combat that is not active', () => {
		const primitives = valid();

		primitives.status = 'completed';

		expectError(errorsOf(primitives), { path: 'status', reason: 'invalid-combat' });
	});

	it('rejects an invalid random state', () => {
		const primitives = valid();

		(primitives as { randomPocket?: unknown }).randomPocket = { seed: 1.5, state: 42 };

		expectError(errorsOf(primitives), { path: 'randomPocket', reason: 'invalid-random-pocket' });
	});

	it('rejects a combat without exactly two groups', () => {
		const primitives = valid();

		primitives.groups.push(structuredClone(group(primitives, 1)));

		expectError(errorsOf(primitives), { path: 'groups', reason: 'invalid-group-count' });
	});

	it('rejects a group without exactly one combatant', () => {
		const primitives = valid();

		group(primitives, 1).combatants.push(structuredClone(combatant(primitives, 0)));

		expectError(errorsOf(primitives), {
			path: 'groups.1.combatants',
			reason: 'invalid-combatant-count',
		});
	});

	it('rejects duplicated group ids', () => {
		const primitives = valid();

		group(primitives, 1).id = 'player';

		expectError(errorsOf(primitives), { path: 'groups.1.id', reason: 'duplicate-id' });
	});

	it('rejects duplicated combatant ids', () => {
		const primitives = valid();

		combatant(primitives, 1).id = combatant(primitives, 0).id;

		expectError(errorsOf(primitives), { path: 'groups.1.combatants.0.id', reason: 'duplicate-id' });
	});

	it('rejects a combatant that belongs to another group', () => {
		const primitives = valid();

		combatant(primitives, 0).groupId = 'opponent';

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.groupId',
			reason: 'invalid-membership',
		});
	});

	it('rejects groups without exactly one active combatant', () => {
		const primitives = valid();
		const groupAttributes = group(primitives, 0).attributes;

		groupAttributes['activeCombatantIds'] = [];
		expectError(errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});

		groupAttributes['activeCombatantIds'] = ['player-emberling', 'opponent-aquafin'];
		expectError(errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});

		groupAttributes['activeCombatantIds'] = ['missing'];
		expectError(errorsOf(primitives), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});
	});

	it('rejects missing and out-of-range battle attributes', () => {
		const primitives = valid();
		const combatantAttributes = attributes(primitives);

		delete combatantAttributes['level'];
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.level',
			reason: 'missing-attribute',
		});

		combatantAttributes['level'] = 0;
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.level',
			reason: 'invalid-attribute',
		});

		combatantAttributes['movePp'] = [];
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.movePp',
			reason: 'invalid-attribute',
		});
	});

	it('rejects current hp outside its valid range', () => {
		const primitives = valid();
		const combatantAttributes = attributes(primitives);

		combatantAttributes['hp'] = 0;
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.hp',
			reason: 'invalid-hp',
		});

		combatantAttributes['hp'] = 105;
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.attributes.hp',
			reason: 'invalid-hp',
		});
	});

	it('rejects creatures without species or types', () => {
		const primitives = valid();
		const first = combatant(primitives, 0);
		const second = combatant(primitives, 1);

		first.creature.species.id = '';
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.id',
			reason: 'missing-species',
		});

		second.creature.species.attributes['types'] = [];
		expectError(errorsOf(primitives), {
			path: 'groups.1.combatants.0.creature.species.attributes.types',
			reason: 'missing-types',
		});
	});

	it('rejects missing, oversized, and duplicated loadouts', () => {
		const primitives = valid();
		const first = combatant(primitives, 0);
		const [move] = first.creature.moves;

		if (!move) {
			throw new Error('Missing fixture move');
		}

		first.creature.moves = [];
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'missing-moves',
		});

		first.creature.moves = Array.from({ length: 5 }, (_, index) => ({ ...move, id: `move-${String(index)}` }));
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'invalid-moves',
		});

		first.creature.moves = [move, { ...move }];
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'invalid-moves',
		});
	});

	it('rejects species snapshots without their base stats', () => {
		const primitives = valid();

		delete combatant(primitives, 0).creature.species.attributes['baseHp'];

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.attributes.baseHp',
			reason: 'missing-attribute',
		});
	});

	it('rejects species snapshots with invalid base stats', () => {
		const primitives = valid();

		combatant(primitives, 0).creature.species.attributes['baseHp'] = 0;

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.species.attributes.baseHp',
			reason: 'invalid-attribute',
		});
	});

	it('rejects move snapshots without their attributes', () => {
		const primitives = valid();

		combatant(primitives, 0).creature.moves = [
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

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0.attributes.accuracy',
			reason: 'missing-attribute',
		});
	});

	it('rejects move snapshots outside the Phase 1 slice', () => {
		const primitives = valid();

		combatant(primitives, 0).creature.moves = [
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

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0',
			reason: 'unsupported-move',
		});
	});

	it('rejects move snapshots with unsupported flags', () => {
		const primitives = valid();
		const move = combatant(primitives, 0).creature.moves[0];

		if (!move) {
			throw new Error('Missing fixture move');
		}

		combatant(primitives, 0).creature.moves = [
			{ ...move, attributes: { ...move.attributes, flags: [{ name: 'charge', value: 1 }] } },
		];

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.moves.0',
			reason: 'unsupported-move',
		});
	});

	it('rejects combat and creature attributes outside Phase 1', () => {
		const primitives = valid();
		const first = combatant(primitives, 0);

		primitives.attributes = { power: 5 };
		first.creature.attributes = { power: 5 };
		first.creature.abilities = [{}] as never;

		expectError(errorsOf(primitives), { path: 'attributes.power', reason: 'invalid-attribute' });
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.attributes.power',
			reason: 'invalid-attribute',
		});
		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.abilities',
			reason: 'invalid-combat',
		});
	});

	it('rejects a creature without an id', () => {
		const primitives = valid();

		combatant(primitives, 0).creature.id = '';

		expectError(errorsOf(primitives), {
			path: 'groups.0.combatants.0.creature.id',
			reason: 'missing-id',
		});
	});

	it('aggregates every violation instead of stopping at the first', () => {
		const primitives = valid();
		const first = combatant(primitives, 0);

		delete attributes(primitives)['level'];
		attributes(primitives)['hp'] = 0;
		first.groupId = 'missing';

		const errors = errorsOf(primitives);

		expect(errors.length).toBeGreaterThanOrEqual(3);
		expectError(errors, { reason: 'missing-attribute' });
		expectError(errors, { reason: 'invalid-hp' });
		expectError(errors, { reason: 'invalid-membership' });
	});
});
