import Either from '@hexadrop/either';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatEvent, CombatPrimitives, CombatTransition } from '@pocket-forge/combat/domain';
import {
	Combat as CombatEntity,
	CombatEngine,
	CombatEngineError,
	CombatResolutionError,
	CombatRulesetError,
	CombatSetup,
	CombatTransitionError,
} from '@pocket-forge/combat/domain';
import { CombatantMother, CombatMother } from '@pocket-forge/combat/mother/domain';
import { beforeEach, describe, expect, it } from 'bun:test';

import { actionSet, FakeActionPlugin, FakeCombatRuleset, FakeCompletionRule } from './engine.fakes';

function withAttributes(combat: Combat, attributes: AttributeValues): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), attributes });
}

function withId(combat: Combat, id: string): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), id });
}

function withStatus(combat: Combat, status: CombatPrimitives['status']): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), status });
}

function event(sequence: number, type = 'action-resolved'): CombatEvent {
	return { payload: { actionId: 'tackle' }, sequence, type };
}

describe('CombatEngine', () => {
	let ruleset: FakeCombatRuleset;
	let plugin: FakeActionPlugin;
	let completion: FakeCompletionRule;
	let engine: CombatEngine;

	beforeEach(() => {
		ruleset = new FakeCombatRuleset();
		plugin = new FakeActionPlugin();
		completion = new FakeCompletionRule();
		engine = new CombatEngine(CombatSetup.create({ actions: plugin, actionSet: actionSet(), completion, ruleset }));
	});

	describe('validateComposition', () => {
		it('accepts a combat that satisfies the ruleset', () => {
			expect(engine.validateComposition(CombatMother.create()).isRight()).toBe(true);
		});

		it('delegates validation to the ruleset', () => {
			ruleset.validateWith = () => Either.left([new CombatRulesetError('invalid-constraints', 'Nope', 'groups')]);

			const result = engine.validateComposition(CombatMother.create());

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		});
	});

	describe('resolve', () => {
		it('rejects an invalid current composition before resolving', () => {
			const combat = CombatMother.create();
			ruleset.validateWith = () =>
				Either.left([new CombatRulesetError('invalid-constraints', 'Invalid current composition', 'groups')]);

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatRulesetError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
			expect(plugin.contexts).toHaveLength(0);
			expect(completion.evaluated).toHaveLength(0);
		});

		it('returns the successor, its events, and no outcome while combat continues', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const events = [event(1), event(2)];

			plugin.resolveWith = () => Either.right({ combat: successor, events });

			const result = engine.resolve(combat, 'input');

			expect(result.isRight()).toBe(true);

			const resolution = result.getRight();
			expect(resolution.combat).toBe(successor);
			expect(resolution.events).toEqual(events);
			expect(resolution.outcome).toBeUndefined();
			expect(plugin.contexts).toHaveLength(1);
			expect(plugin.contexts[0]?.combat).toBe(combat);
			expect(plugin.contexts[0]?.input).toBe('input');
		});

		it('produces a completed successor with an outcome and a completion event', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const winnerGroupId = successor.groups[0]?.id ?? '';
			const events = [event(1), event(2)];

			plugin.resolveWith = () => Either.right({ combat: successor, events });
			completion.outcome = { status: 'victory', winnerGroupId };

			const result = engine.resolve(combat, 'input');

			expect(result.isRight()).toBe(true);

			const resolution = result.getRight();
			expect(resolution.combat.status).toBe('completed');
			expect(resolution.combat.id).toBe(combat.id);
			expect(resolution.combat.attributes.toPrimitives()).toEqual({ power: 7 });
			expect(resolution.combat.randomPocket).toBe(successor.randomPocket);
			expect(resolution.outcome).toEqual({ status: 'victory', winnerGroupId });
			expect(resolution.events).toHaveLength(3);
			expect(resolution.events[0]).toEqual(events[0]);
			expect(resolution.events[1]).toEqual(events[1]);
			expect(resolution.events[2]).toEqual({
				payload: { status: 'victory', winnerGroupId },
				sequence: 3,
				type: 'combat-completed',
			});
			expect(completion.evaluated).toHaveLength(1);
			expect(completion.evaluated[0]).toBe(successor);
		});

		it('rejects a completion outcome with an unknown winning group', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			plugin.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'victory', winnerGroupId: 'missing-group' };

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-outcome');
			expect(result.getLeft()[0]?.path).toBe('outcome.winnerGroupId');
			expect(result.getLeft()[0]?.message).toMatch(/unknown winning group/);
		});

		it('serializes a draw completion with a stable sequence', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			plugin.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'draw' };

			const resolution = engine.resolve(combat, 'input').getRight();

			expect(resolution.outcome).toEqual({ status: 'draw' });
			expect(resolution.events).toEqual([{ payload: { status: 'draw' }, sequence: 1, type: 'combat-completed' }]);
		});

		it('rejects a combat that is not active', () => {
			const combat = CombatMother.create({ status: 'completed' });
			const before = combat.toPrimitives();

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()).toHaveLength(1);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
			expect(plugin.contexts).toHaveLength(0);
			expect(completion.evaluated).toHaveLength(0);
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('propagates plugin rejections without producing a successor', () => {
			const combat = CombatMother.create();
			const error = new CombatResolutionError('invalid-input', 'Unsupported input', 'input');
			plugin.resolveWith = () => Either.left([error]);

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()).toEqual([error]);
			expect(completion.evaluated).toHaveLength(0);
		});

		it('rejects a successor with a different combat id', () => {
			const combat = CombatMother.create();
			plugin.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: withId(combat, 'other-combat'),
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-transition');
			expect(result.getLeft()[0]?.path).toBe('transition.combat.id');
		});

		it('rejects a successor that the plugin already completed', () => {
			const combat = CombatMother.create();
			plugin.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: withStatus(combat, 'completed'),
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-transition');
			expect(result.getLeft()[0]?.path).toBe('transition.combat.status');
			expect(result.getLeft()[0]?.message).toMatch(/Action plugins cannot complete Combat/);
			expect(completion.evaluated).toHaveLength(0);
		});

		it('rejects a successor with invalid membership', () => {
			const combat = CombatMother.create();
			const groupId = combat.groups[0]?.id ?? '';
			const succession = CombatEntity.fromPrimitives({
				...combat.toPrimitives(),
				groups: [
					{
						attributes: {},
						combatants: [CombatantMother.primitives({ groupId: 'another-group', id: 'combatant-1' })],
						id: groupId,
					},
				],
			});

			plugin.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: succession,
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatTransitionError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-membership');
			expect(result.getLeft()[0]?.path).toBe('groups.0.combatants.0.groupId');
			expect(completion.evaluated).toHaveLength(0);
		});

		it('rejects a successor rejected by the ruleset composition', () => {
			const combat = CombatMother.create();
			const primitives = combat.toPrimitives();
			const group = primitives.groups[0];

			if (!group) {
				throw new Error('Expected the combat to have at least one group');
			}

			const succession = CombatEntity.fromPrimitives({
				...primitives,
				groups: [
					{
						...group,
						combatants: group.combatants.map(combatant => ({ ...combatant, groupId: 'Invalid' })),
						id: 'Invalid',
					},
				],
			});

			ruleset.validateWith = groups =>
				groups.some(group => group.id === 'Invalid')
					? Either.left([new CombatRulesetError('invalid-constraints', 'Group id is reserved', 'groups')])
					: Either.right();

			plugin.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: succession,
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatRulesetError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
			expect(completion.evaluated).toHaveLength(0);
		});

		it('leaves the input combat and its RandomPocket untouched on success', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();
			const randomPocket = combat.randomPocket;

			plugin.resolveWith = () => Either.right({ combat: withAttributes(combat, { power: 7 }), events: [] });

			expect(engine.resolve(combat, 'input').isRight()).toBe(true);
			expect(combat.toPrimitives()).toEqual(before);
			expect(combat.randomPocket).toBe(randomPocket);
		});

		it('leaves the input combat and its RandomPocket untouched on rejection', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();
			const randomPocket = combat.randomPocket;

			plugin.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: withStatus(combat, 'completed'),
					events: [],
				});

			expect(engine.resolve(combat, 'input').isLeft()).toBe(true);
			expect(combat.toPrimitives()).toEqual(before);
			expect(combat.randomPocket).toBe(randomPocket);
		});
	});
});
