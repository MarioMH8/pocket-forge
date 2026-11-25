import { Combat } from '@pocket-forge/combat/domain';
import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonCombatStartError, DuelmonCombatStartRequest } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { describe, expect, it } from 'bun:test';

type StartError = DuelmonCombatStartError;

type DeepMutable<T> = T extends readonly (infer U)[]
	? DeepMutable<U>[]
	: T extends object
		? { -readonly [K in keyof T]: DeepMutable<T[K]> }
		: T;

type MutableRequest = DeepMutable<DuelmonCombatStartRequest>;

function valid(): MutableRequest {
	return structuredClone(DuelmonCombatStartMother.request()) as MutableRequest;
}

function group(request: MutableRequest, index: number) {
	const value = request.groups[index];

	if (!value) {
		throw new Error(`Missing group at index ${String(index)}`);
	}

	return value;
}

function combatant(request: MutableRequest, groupIndex: number, combatantIndex = 0) {
	const value = group(request, groupIndex).combatants[combatantIndex];

	if (!value) {
		throw new Error(`Missing combatant at index ${String(combatantIndex)}`);
	}

	return value;
}

function start(request: DuelmonCombatStartRequest) {
	return DuelmonCombatStart.fromContent(
		request,
		DuelmonCombatStartMother.catalog(),
		DuelmonCombatStartMother.DEFINITIONS
	);
}

function errorsOf(request: DuelmonCombatStartRequest): StartError[] {
	const result = start(request);

	expect(result.isLeft()).toBe(true);

	return result.getLeft();
}

function expectError(errors: StartError[], expected: { path?: string; reason: string }): void {
	const matches = errors.filter(
		error => error.reason === expected.reason && (expected.path === undefined || error.path === expected.path)
	);

	expect(matches.length).toBeGreaterThan(0);
}

describe('DuelmonCombatStart.fromContent', () => {
	it('builds the initial state from valid content', () => {
		const result = start(DuelmonCombatStartMother.request());

		expect(result.isRight()).toBe(true);
		expect(result.getRight().toPrimitives()).toEqual(DuelmonCombatStartMother.primitives());
	});

	it('assigns the Phase 1 level to every combatant', () => {
		const combat = start(DuelmonCombatStartMother.request()).getRight();

		expect(combat.groups.map(groupEntry => groupEntry.combatants[0]?.attributes.toPrimitives()['level'])).toEqual([
			50, 50,
		]);
	});

	it('produces the same state twice and survives a round trip', () => {
		const first = start(DuelmonCombatStartMother.request()).getRight().toPrimitives();
		const second = start(DuelmonCombatStartMother.request()).getRight().toPrimitives();

		expect(second).toEqual(first);
		expect(Combat.fromPrimitives(first).toPrimitives()).toEqual(first);
	});

	it('only carries Phase 1 battle attributes', () => {
		const primitives = start(DuelmonCombatStartMother.request()).getRight().toPrimitives();

		expect(Object.keys(primitives.attributes)).toEqual([]);

		for (const groupEntry of primitives.groups) {
			expect(Object.keys(groupEntry.attributes)).toEqual(['activeCombatantIds']);

			for (const combatantEntry of groupEntry.combatants) {
				expect(
					Object.keys(combatantEntry.attributes).toSorted((left, right) => left.localeCompare(right))
				).toEqual(['attack', 'defense', 'hp', 'level', 'maxHp', 'special', 'speed']);
				expect(combatantEntry.attributes['status']).toBeUndefined();
				expect(combatantEntry.attributes['movePp']).toBeUndefined();
			}
		}
	});

	it('uses the request seed for the random state', () => {
		const primitives = start(DuelmonCombatStartMother.request({ seed: 7 }))
			.getRight()
			.toPrimitives();

		expect(primitives.randomPocket).toEqual({ seed: 7, state: 7 });
	});

	it('rejects unknown species', () => {
		const request = valid();

		combatant(request, 0).speciesId = 'missing';

		expectError(errorsOf(request), {
			path: 'groups.0.combatants.0.creature.species.id',
			reason: 'unknown-species',
		});
	});

	it('rejects unknown moves', () => {
		const request = valid();

		combatant(request, 0).moveIds = ['tackle', 'missing'];

		expectError(errorsOf(request), {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'unknown-move',
		});
	});

	it('rejects moves outside the Phase 1 slice', () => {
		for (const moveId of ['oath', 'quick-jab', 'flare']) {
			const request = valid();

			combatant(request, 0).moveIds = [moveId];

			expectError(errorsOf(request), {
				path: 'groups.0.combatants.0.creature.moves.0',
				reason: 'unsupported-move',
			});
		}
	});

	it('rejects moves with flags outside the Phase 1 slice', () => {
		const charge = {
			accuracy: true as const,
			category: 'Special' as const,
			flags: { charge: 1 },
			id: 'solar-beam',
			name: 'Solar Beam',
			power: 120,
			pp: 10,
			priority: 0,
			target: 'normal',
			type: 'Grass' as const,
		};
		const catalog = DuelmonCatalog.fromDataset(
			DuelmonDatasetMother.create({ moves: [...DuelmonDatasetMother.moves(), charge] })
		).getRight();
		const request = valid();

		combatant(request, 0).moveIds = ['solar-beam'];

		const result = DuelmonCombatStart.fromContent(request, catalog, DuelmonCombatStartMother.DEFINITIONS);

		expect(result.isLeft()).toBe(true);

		const [error] = result.getLeft();

		expect(error?.reason).toBe('unsupported-move');
		expect(error?.path).toBe('groups.0.combatants.0.creature.moves.0');
		expect(error?.message).toContain('charge');
	});

	it('rejects a missing loadout', () => {
		const request = valid();

		combatant(request, 0).moveIds = [];

		expectError(errorsOf(request), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'missing-moves',
		});
	});

	it('rejects a malformed request', () => {
		const request = valid();

		request.seed = 1.5;
		expectError(errorsOf(request), { path: 'seed', reason: 'invalid-request' });

		combatant(request, 0).speciesId = '';
		expectError(errorsOf(request), {
			path: 'groups.0.combatants.0.speciesId',
			reason: 'invalid-request',
		});
	});

	it('aggregates every content failure', () => {
		const request = valid();

		combatant(request, 0).speciesId = 'missing-species';
		combatant(request, 1).moveIds = ['tackle', 'missing-move'];

		expect(errorsOf(request).length).toBeGreaterThanOrEqual(2);
	});

	it('rejects a request without exactly two groups', () => {
		const request = valid();

		request.groups.splice(1);

		expectError(errorsOf(request), { path: 'groups', reason: 'invalid-group-count' });
	});

	it('rejects a request with more than one active combatant', () => {
		const request = valid();

		group(request, 0).activeCombatantIds.push('other');

		expectError(errorsOf(request), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});
	});

	it('aggregates structural request errors with content errors', () => {
		const request = valid();
		const extraGroup = structuredClone(group(request, 1));

		extraGroup.id = 'extra';
		extraGroup.activeCombatantIds = ['extra-combatant'];

		const [extraCombatant] = extraGroup.combatants;

		if (!extraCombatant) {
			throw new Error('Missing extra combatant');
		}

		extraCombatant.id = 'extra-combatant';
		request.groups.push(extraGroup);
		combatant(request, 0).moveIds = ['ember-burst', 'missing'];

		const errors = errorsOf(request);

		expectError(errors, { path: 'groups', reason: 'invalid-group-count' });
		expectError(errors, {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'unknown-move',
		});
	});
});
