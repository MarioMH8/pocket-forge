import Either from '@hexadrop/either';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity, CombatTransitionError } from '@pocket-forge/combat/domain';
import { CombatMother } from '@pocket-forge/combat/mother/domain';
import type { CombatEvent, CombatRule, CombatTransition } from '@pocket-forge/combat-engine/domain';
import {
	CombatEngine,
	CombatEngineError,
	CombatResolutionError,
	CombatRuleError,
	CombatSetup,
} from '@pocket-forge/combat-engine/domain';
import { beforeEach, describe, expect, it } from 'bun:test';

import { FakeActionResolver, FakeCompletionRule, FakeCompositionRule, moveBindings } from './engine.fakes';

function withAttributes(combat: Combat, attributes: AttributeValues): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), attributes });
}

function withId(combat: Combat, id: string): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), id });
}

function withStatus(combat: Combat, status: CombatPrimitives['status']): Combat {
	return CombatEntity.fromPrimitives({ ...combat.toPrimitives(), status });
}

function event(sequence: number, type = 'tackle'): CombatEvent {
	return { payload: {}, sequence, type };
}

function engineWith(rules: readonly CombatRule[], resolver: FakeActionResolver): CombatEngine {
	return new CombatEngine(CombatSetup.create({ actions: resolver, moveBindings: moveBindings(), rules }));
}

describe('CombatEngine', () => {
	let composition: FakeCompositionRule;
	let completion: FakeCompletionRule;
	let resolver: FakeActionResolver;
	let engine: CombatEngine;

	beforeEach(() => {
		composition = new FakeCompositionRule();
		completion = new FakeCompletionRule();
		resolver = new FakeActionResolver();
		engine = engineWith([composition, completion], resolver);
	});

	describe('validateComposition', () => {
		it('accepts a combat that satisfies every composition rule', () => {
			expect(engine.validateComposition(CombatMother.create()).isRight()).toBe(true);
		});

		it('delegates validation to every composition rule', () => {
			composition.validateWith = () =>
				Either.left([new CombatRuleError('invalid-constraints', 'Nope', 'groups')]);

			const result = engine.validateComposition(CombatMother.create());

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		});

		it('aggregates rejections from multiple composition rules', () => {
			const second = new FakeCompositionRule();
			composition.validateWith = () =>
				Either.left([new CombatRuleError('invalid-constraints', 'First', 'groups')]);
			second.validateWith = () => Either.left([new CombatRuleError('invalid-constraints', 'Second', 'groups')]);

			const result = engineWith([composition, second, completion], resolver).validateComposition(
				CombatMother.create()
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.message)).toEqual(['First', 'Second']);
		});

		it('skips rules without a composition hook', () => {
			const result = engineWith([completion], resolver).validateComposition(CombatMother.create());

			expect(result.isRight()).toBe(true);
		});
	});

	describe('resolve', () => {
		it('rejects an invalid current composition before resolving', () => {
			const combat = CombatMother.create();
			composition.validateWith = () =>
				Either.left([new CombatRuleError('invalid-constraints', 'Invalid current composition', 'groups')]);

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatRuleError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
			expect(resolver.contexts).toHaveLength(0);
			expect(completion.evaluated).toHaveLength(0);
		});

		it('returns the successor, its events, and no outcome while combat continues', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const events = [event(1), event(2)];

			resolver.resolveWith = () => Either.right({ combat: successor, events });

			const result = engine.resolve(combat, 'input');

			expect(result.isRight()).toBe(true);

			const resolution = result.getRight();
			expect(resolution.combat).toBe(successor);
			expect(resolution.events).toEqual(events);
			expect(resolution.outcome).toBeUndefined();
			expect(resolver.contexts).toHaveLength(1);
			expect(resolver.contexts[0]?.combat).toBe(combat);
			expect(resolver.contexts[0]?.input).toBe('input');
			expect(resolver.contexts[0]?.moveBindings).toBeDefined();
		});

		it('produces a completed successor when a completion rule returns an outcome', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const winnerGroupId = successor.groups[0]?.id ?? '';
			const events = [event(1), event(2)];

			resolver.resolveWith = () => Either.right({ combat: successor, events });
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

		it('accepts multiple completion rules that agree', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const winnerGroupId = successor.groups[0]?.id ?? '';
			const second = new FakeCompletionRule();

			resolver.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'victory', winnerGroupId };
			second.outcome = { status: 'victory', winnerGroupId };

			const result = engineWith([composition, completion, second], resolver).resolve(combat, 'input');

			expect(result.isRight()).toBe(true);
			expect(result.getRight().outcome).toEqual({ status: 'victory', winnerGroupId });
			expect(completion.evaluated).toHaveLength(1);
			expect(second.evaluated).toHaveLength(1);
		});

		it('rejects conflicting completion outcomes', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });
			const second = new FakeCompletionRule();

			resolver.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'victory', winnerGroupId: successor.groups[0]?.id ?? '' };
			second.outcome = { status: 'draw' };

			const result = engineWith([composition, completion, second], resolver).resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('conflicting-outcome');
			expect(result.getLeft()[0]?.path).toBe('outcome');
		});

		it('skips rules without a completion hook', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			resolver.resolveWith = () => Either.right({ combat: successor, events: [] });

			const result = engineWith([composition], resolver).resolve(combat, 'input');

			expect(result.isRight()).toBe(true);
			expect(result.getRight().outcome).toBeUndefined();
		});

		it('rejects a completion outcome with an unknown winning group', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			resolver.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'victory', winnerGroupId: 'missing-group' };

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-outcome');
			expect(result.getLeft()[0]?.path).toBe('outcome.winnerGroupId');
			expect(result.getLeft()[0]?.message).toMatch(/unknown winning group/);
		});

		it('serializes a draw', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			resolver.resolveWith = () => Either.right({ combat: successor, events: [] });
			completion.outcome = { status: 'draw' };

			const resolution = engine.resolve(combat, 'input').getRight();

			expect(resolution.outcome).toEqual({ status: 'draw' });
			expect(resolution.events).toHaveLength(1);
			expect(resolution.events[0]).toEqual({
				payload: { status: 'draw' },
				sequence: 1,
				type: 'combat-completed',
			});
		});

		it('rejects a combat that is not active', () => {
			const combat = CombatMother.create({ status: 'completed' });
			const before = combat.toPrimitives();

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
			expect(resolver.contexts).toHaveLength(0);
			expect(completion.evaluated).toHaveLength(0);
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('rejects a successor with a different combat id', () => {
			const combat = CombatMother.create();

			resolver.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: withId(combat, 'other-combat'),
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-transition');
			expect(result.getLeft()[0]?.path).toBe('transition.combat.id');
		});

		it('rejects a successor that the resolver already completed', () => {
			const combat = CombatMother.create();

			resolver.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({
					combat: withStatus(combat, 'completed'),
					events: [],
				});

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatEngineError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-transition');
			expect(result.getLeft()[0]?.path).toBe('transition.combat.status');
		});

		it('rejects a successor with invalid membership', () => {
			const combat = CombatMother.create();
			const primitives = combat.toPrimitives();
			const group = primitives.groups[0];

			if (!group) {
				throw new Error('Expected the combat to have at least one group');
			}

			const successor = CombatEntity.fromPrimitives({
				...primitives,
				groups: [
					{
						...group,
						combatants: group.combatants.map(combatant => ({ ...combatant, groupId: 'missing' })),
					},
				],
			});

			resolver.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({ combat: successor, events: [] });

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatTransitionError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-membership');
		});

		it('rejects a successor with an invalid composition', () => {
			const combat = CombatMother.create();
			const successor = withAttributes(combat, { power: 7 });

			resolver.resolveWith = () =>
				Either.right<CombatResolutionError[], CombatTransition>({ combat: successor, events: [] });
			let calls = 0;
			composition.validateWith = () => {
				calls += 1;

				return calls === 1
					? Either.right()
					: Either.left([new CombatRuleError('invalid-constraints', 'Invalid successor', 'groups')]);
			};

			const result = engine.resolve(combat, 'input');

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]).toBeInstanceOf(CombatRuleError);
			expect(result.getLeft()[0]?.reason).toBe('invalid-constraints');
		});

		it('leaves the input combat untouched on success', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();
			const randomPocket = combat.randomPocket;

			resolver.resolveWith = () => Either.right({ combat: withAttributes(combat, { power: 7 }), events: [] });

			expect(engine.resolve(combat, 'input').isRight()).toBe(true);
			expect(combat.toPrimitives()).toEqual(before);
			expect(combat.randomPocket).toBe(randomPocket);
		});
	});
});
