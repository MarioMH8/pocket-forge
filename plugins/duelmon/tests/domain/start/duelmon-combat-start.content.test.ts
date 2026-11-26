import { Combat } from '@pocket-forge/combat/domain';
import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonCombatStartError, DuelmonCombatStartRequest } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStart, DuelmonMove, DuelmonSpecies, Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
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

class CombatStartContentFixture {
	static combatant(request: MutableRequest, groupIndex: number, combatantIndex = 0) {
		const value = this.group(request, groupIndex).combatants[combatantIndex];

		if (!value) {
			throw new Error(`Missing combatant at index ${String(combatantIndex)}`);
		}

		return value;
	}

	static errorsOf(request: DuelmonCombatStartRequest): StartError[] {
		const result = this.start(request);

		expect(result.isLeft()).toBe(true);

		return result.getLeft();
	}

	static expectError(errors: StartError[], expected: { path?: string; reason: string }): void {
		const matches = errors.filter(
			error => error.reason === expected.reason && (expected.path === undefined || error.path === expected.path)
		);

		expect(matches.length).toBeGreaterThan(0);
	}

	static group(request: MutableRequest, index: number) {
		const value = request.groups[index];

		if (!value) {
			throw new Error(`Missing group at index ${String(index)}`);
		}

		return value;
	}

	static start(request: DuelmonCombatStartRequest) {
		return DuelmonCombatStart.fromContent(
			request,
			DuelmonCombatStartMother.catalog(),
			DuelmonCombatStartMother.DEFINITIONS
		);
	}

	static valid(): MutableRequest {
		return structuredClone(DuelmonCombatStartMother.request()) as MutableRequest;
	}
}

describe('DuelmonCombatStart.fromContent', () => {
	it('builds the initial state from valid content', () => {
		const result = CombatStartContentFixture.start(DuelmonCombatStartMother.request());

		expect(result.isRight()).toBe(true);
		expect(result.getRight().toPrimitives()).toEqual(DuelmonCombatStartMother.primitives());
	});

	it('assigns the Phase 1 level to every combatant', () => {
		const combat = CombatStartContentFixture.start(DuelmonCombatStartMother.request()).getRight();

		expect(combat.groups.map(groupEntry => groupEntry.combatants[0]?.attributes.toPrimitives()['level'])).toEqual([
			50, 50,
		]);
	});

	it('produces the same state twice and survives a round trip', () => {
		const first = CombatStartContentFixture.start(DuelmonCombatStartMother.request()).getRight().toPrimitives();
		const second = CombatStartContentFixture.start(DuelmonCombatStartMother.request()).getRight().toPrimitives();

		expect(second).toEqual(first);
		expect(Combat.fromPrimitives(first).toPrimitives()).toEqual(first);
	});

	it('only carries Phase 1 battle attributes', () => {
		const primitives = CombatStartContentFixture.start(DuelmonCombatStartMother.request())
			.getRight()
			.toPrimitives();

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
		const primitives = CombatStartContentFixture.start(DuelmonCombatStartMother.request({ seed: 7 }))
			.getRight()
			.toPrimitives();

		expect(primitives.randomPocket).toEqual({ seed: 7, state: 7 });
	});

	it('rejects unknown species', () => {
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.combatant(request, 0).speciesId = 'missing';

		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups.0.combatants.0.creature.species.id',
			reason: 'unknown-species',
		});
	});

	it('rejects unknown moves', () => {
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.combatant(request, 0).moveIds = ['tackle', 'missing'];

		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'unknown-move',
		});
	});

	it('rejects moves outside the Phase 1 slice', () => {
		for (const moveId of ['oath', 'quick-jab', 'flare']) {
			const request = CombatStartContentFixture.valid();

			CombatStartContentFixture.combatant(request, 0).moveIds = [moveId];

			CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
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
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.combatant(request, 0).moveIds = ['solar-beam'];

		const result = DuelmonCombatStart.fromContent(request, catalog, DuelmonCombatStartMother.DEFINITIONS);

		expect(result.isLeft()).toBe(true);

		const [error] = result.getLeft();

		expect(error?.reason).toBe('unsupported-move');
		expect(error?.path).toBe('groups.0.combatants.0.creature.moves.0');
		expect(error?.message).toContain('charge');
	});

	it('rejects a missing loadout', () => {
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.combatant(request, 0).moveIds = [];

		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups.0.combatants.0.creature.moves',
			reason: 'missing-moves',
		});
	});

	it('rejects a malformed request', () => {
		const request = CombatStartContentFixture.valid();

		request.seed = 1.5;
		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'seed',
			reason: 'invalid-request',
		});

		CombatStartContentFixture.combatant(request, 0).speciesId = '';
		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups.0.combatants.0.speciesId',
			reason: 'invalid-request',
		});
	});

	it('aggregates every content failure', () => {
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.combatant(request, 0).speciesId = 'missing-species';
		CombatStartContentFixture.combatant(request, 1).moveIds = ['tackle', 'missing-move'];

		expect(CombatStartContentFixture.errorsOf(request).length).toBeGreaterThanOrEqual(2);
	});

	it('rejects a request without exactly two groups', () => {
		const request = CombatStartContentFixture.valid();

		request.groups.splice(1);

		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups',
			reason: 'invalid-group-count',
		});
	});

	it('rejects a request with more than one active combatant', () => {
		const request = CombatStartContentFixture.valid();

		CombatStartContentFixture.group(request, 0).activeCombatantIds.push('other');

		CombatStartContentFixture.expectError(CombatStartContentFixture.errorsOf(request), {
			path: 'groups.0.attributes.activeCombatantIds',
			reason: 'invalid-active-combatant',
		});
	});

	it('aggregates structural request errors with content errors', () => {
		const request = CombatStartContentFixture.valid();
		const extraGroup = structuredClone(CombatStartContentFixture.group(request, 1));

		extraGroup.id = 'extra';
		extraGroup.activeCombatantIds = ['extra-combatant'];

		const [extraCombatant] = extraGroup.combatants;

		if (!extraCombatant) {
			throw new Error('Missing extra combatant');
		}

		extraCombatant.id = 'extra-combatant';
		request.groups.push(extraGroup);
		CombatStartContentFixture.combatant(request, 0).moveIds = ['ember-burst', 'missing'];

		const errors = CombatStartContentFixture.errorsOf(request);

		CombatStartContentFixture.expectError(errors, { path: 'groups', reason: 'invalid-group-count' });
		CombatStartContentFixture.expectError(errors, {
			path: 'groups.0.combatants.0.creature.moves.1',
			reason: 'unknown-move',
		});
	});
});

describe('Phase 1 minimum content set', () => {
	const catalog = DuelmonCombatStartMother.catalog();
	const SPECIES_IDS = ['aquafin', 'emberling', 'sprout'] as const;
	const MOVE_IDS = ['aqua-burst', 'ember-burst', 'leaf-lash', 'shade', 'tackle'] as const;
	const LOADOUTS = {
		aquafin: ['aqua-burst', 'tackle'],
		emberling: ['ember-burst', 'tackle'],
		sprout: ['leaf-lash', 'tackle'],
	} as const;

	function speciesView(id: string): DuelmonSpecies {
		const species = catalog.findSpecies(id);

		if (!species) {
			throw new Error(`Missing fixture species "${id}"`);
		}

		return DuelmonSpecies.fromSpecies(species);
	}

	function moveView(id: string): DuelmonMove {
		const move = catalog.findMove(id);

		if (!move) {
			throw new Error(`Missing fixture move "${id}"`);
		}

		return DuelmonMove.fromMove(move);
	}

	it('provides three creatures with distinct types', () => {
		const types = SPECIES_IDS.flatMap(id => speciesView(id).types);

		expect(SPECIES_IDS).toHaveLength(3);
		expect(new Set(types).size).toBeGreaterThanOrEqual(2);
	});

	it('provides four to six simple moves with physical and special categories', () => {
		const moves = MOVE_IDS.map(id => moveView(id));

		expect(moves.length).toBeGreaterThanOrEqual(4);
		expect(moves.length).toBeLessThanOrEqual(6);

		for (const move of moves) {
			expect(Phase1MoveConstraints.unsupportedReason(move)).toBeUndefined();
		}

		expect(moves.some(move => move.category === 'Physical')).toBe(true);
		expect(moves.some(move => move.category === 'Special')).toBe(true);
	});

	it('includes an affinity case and loadouts drawn from the minimum set', () => {
		expect(catalog.typeMultipliers('Fire', ['Water'])).toEqual([0.5]);
		expect(catalog.typeMultipliers('Water', ['Fire'])).toEqual([2]);

		for (const id of Object.values(LOADOUTS).flat()) {
			expect(MOVE_IDS).toContain(id);
		}
	});
});
