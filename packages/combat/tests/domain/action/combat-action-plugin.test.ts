import Either from '@hexadrop/either';
import type {
	CombatActionCatalog,
	CombatActionContext,
	CombatActionDescriptor,
	CombatActionPlugin,
	CombatActionSetPrimitives,
	CombatTransition,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { CombatActionSet, CombatResolutionError } from '@pocket-forge/combat/domain';
import { CombatMother } from '@pocket-forge/combat/mother/domain';
import { describe, expect, it } from 'bun:test';

import FakeContractVersionValidator from './fake-contract-version.validator';

const TACKLE: CombatActionDescriptor = {
	configDefinitions: [],
	id: 'tackle',
};

class TestActionCatalog implements CombatActionCatalog {
	find(actionId: string): CombatActionDescriptor | undefined {
		return actionId === TACKLE.id ? TACKLE : undefined;
	}
}

class TestActionPlugin implements CombatActionPlugin {
	readonly actions: CombatActionCatalog = new TestActionCatalog();
	readonly contractVersion = '1.2.0';
	readonly id = 'test-plugin';

	constructor(private readonly versionValidator: ContractVersionValidator) {}

	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		const binding = context.actionSet.find('move-1');

		if (!binding) {
			return Either.left([
				new CombatResolutionError('invalid-action', 'No action is bound to move-1', 'actionSet.bindings'),
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

	supports(actionSet: CombatActionSet): boolean {
		return (
			actionSet.plugin.id === this.id &&
			this.versionValidator.isValid(this.contractVersion) &&
			this.versionValidator.isValidRange(actionSet.plugin.contractVersion) &&
			this.versionValidator.satisfies(this.contractVersion, actionSet.plugin.contractVersion)
		);
	}
}

const VERSION_VALIDATOR = new FakeContractVersionValidator();
const PLUGIN = new TestActionPlugin(VERSION_VALIDATOR);

function actionSet(overrides?: Partial<CombatActionSetPrimitives>): CombatActionSet {
	const primitives: CombatActionSetPrimitives = {
		bindings: [{ actionId: 'tackle', config: {}, moveId: 'move-1' }],
		plugin: { contractVersion: '^1.0.0', id: 'test-plugin' },
		...overrides,
	};

	return CombatActionSet.create(primitives, PLUGIN.actions, VERSION_VALIDATOR).getRight();
}

describe('CombatActionPlugin', () => {
	describe('supports', () => {
		it('accepts an action set with the same plugin id and a compatible range', () => {
			expect(PLUGIN.supports(actionSet())).toBe(true);
		});

		it('rejects an action set targeting another plugin', () => {
			expect(PLUGIN.supports(actionSet({ plugin: { contractVersion: '^1.0.0', id: 'other-plugin' } }))).toBe(
				false
			);
		});

		it('rejects an action set whose range does not accept the plugin version', () => {
			expect(PLUGIN.supports(actionSet({ plugin: { contractVersion: '^2.0.0', id: 'test-plugin' } }))).toBe(
				false
			);
		});
	});

	describe('resolve', () => {
		it('returns a transition with ordered serializable events', () => {
			const combat = CombatMother.create();

			const result = PLUGIN.resolve({ actionSet: actionSet(), combat, input: 'resolve' });

			expect(result.isRight()).toBe(true);

			const transition = result.getRight();
			expect(transition.combat).not.toBe(combat);
			expect(transition.combat.id).toBe(combat.id);
			expect(transition.events).toHaveLength(1);
			expect(transition.events[0]?.sequence).toBe(1);
			expect(transition.events[0]?.type).toBe('action-resolved');
			expect(transition.events[0]?.payload['actionId']).toBe('tackle');
			expect(typeof transition.events[0]?.payload['roll']).toBe('number');
		});

		it('replays deterministically from the same combat snapshot', () => {
			const combat = CombatMother.create();
			const context = { actionSet: actionSet(), combat, input: 'resolve' };

			const first = PLUGIN.resolve(context).getRight();
			const second = PLUGIN.resolve(context).getRight();

			expect(first.events).toEqual(second.events);
			expect(first.combat.randomPocket.toPrimitives()).toEqual(second.combat.randomPocket.toPrimitives());
			expect(first.combat.randomPocket.state).not.toBe(combat.randomPocket.state);
			expect(second.combat.randomPocket.state).not.toBe(combat.randomPocket.state);
		});

		it('rejects invalid input without producing a successor', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();

			const result = PLUGIN.resolve({ actionSet: actionSet(), combat, input: 'unsupported' });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-input');
			expect(result.getLeft()[0]?.path).toBe('input');
			expect(combat.toPrimitives()).toEqual(before);
		});

		it('rejects a missing binding without producing a successor', () => {
			const combat = CombatMother.create();
			const before = combat.toPrimitives();
			const emptySet = actionSet({ bindings: [] });

			const result = PLUGIN.resolve({ actionSet: emptySet, combat, input: 'resolve' });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action');
			expect(combat.toPrimitives()).toEqual(before);
		});
	});
});
