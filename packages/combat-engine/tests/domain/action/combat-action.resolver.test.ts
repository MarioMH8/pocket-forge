import Either from '@hexadrop/either';
import { CombatMother } from '@pocket-forge/combat/mother/domain';
import type {
	CombatActionCatalog,
	CombatActionContext,
	CombatActionDescriptor,
	CombatActionResolver,
	CombatMoveBindingSetPrimitives,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import { CombatMoveBindingSet, CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

const TACKLE: CombatActionDescriptor = {
	configDefinitions: [],
	id: 'tackle',
};

class TestActionCatalog implements CombatActionCatalog {
	find(actionId: string): CombatActionDescriptor | undefined {
		return actionId === TACKLE.id ? TACKLE : undefined;
	}
}

class TestActionResolver implements CombatActionResolver {
	readonly actions: CombatActionCatalog = new TestActionCatalog();

	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		const binding = context.moveBindings.find('move-1');

		if (!binding) {
			return Either.left([
				new CombatResolutionError('invalid-action', 'No action is bound to move-1', 'moveBindings.bindings'),
			]);
		}

		if (context.input !== 'resolve') {
			return Either.left([new CombatResolutionError('invalid-input', 'Expected the resolve input', 'input')]);
		}

		const [roll, nextRandomPocket] = context.combat.randomPocket.nextInt(1, 20);
		const applied = context.combat.apply({
			groups: context.combat.groups,
			randomPocket: nextRandomPocket,
			status: 'active',
		});

		if (applied.isLeft()) {
			return Either.left(
				applied.getLeft().map(error => new CombatResolutionError('rejected', error.message, error.path))
			);
		}

		return Either.right({
			combat: applied.getRight(),
			events: [{ payload: { actionId: binding.actionId, roll }, sequence: 1, type: 'action-resolved' }],
		});
	}
}

const RESOLVER = new TestActionResolver();

function moveBindings(overrides?: Partial<CombatMoveBindingSetPrimitives>): CombatMoveBindingSet {
	const primitives: CombatMoveBindingSetPrimitives = {
		bindings: [{ actionId: 'tackle', config: {}, moveId: 'move-1' }],
		...overrides,
	};

	return CombatMoveBindingSet.create(primitives, RESOLVER.actions).getRight();
}

describe('CombatActionResolver', () => {
	describe('resolve', () => {
		it('returns a transition with ordered serializable events', () => {
			const combat = CombatMother.create();

			const result = RESOLVER.resolve({ combat, input: 'resolve', moveBindings: moveBindings() });

			expect(result.isRight()).toBe(true);

			const transition = result.getRight();
			expect(transition.combat).not.toBe(combat);
			expect(transition.combat.id).toBe(combat.id);
			expect(transition.events).toHaveLength(1);
			expect(transition.events[0]?.type).toBe('action-resolved');
		});

		it('replays deterministically from the same combat snapshot', () => {
			const combat = CombatMother.create();
			const context = { combat, input: 'resolve', moveBindings: moveBindings() };

			const first = RESOLVER.resolve(context).getRight();
			const second = RESOLVER.resolve(context).getRight();

			expect(first.events).toEqual(second.events);
			expect(first.combat.randomPocket.toPrimitives()).toEqual(second.combat.randomPocket.toPrimitives());
			expect(first.combat.randomPocket.state).not.toBe(combat.randomPocket.state);
		});

		it('rejects invalid input without producing a successor', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();

			const result = RESOLVER.resolve({ combat, input: 'unsupported', moveBindings: moveBindings() });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('rejects a missing binding without producing a successor', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();

			const result = RESOLVER.resolve({
				combat,
				input: 'resolve',
				moveBindings: moveBindings({ bindings: [] }),
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action');
			expect(combat.toPrimitives()).toEqual(before);
		});
	});
});
