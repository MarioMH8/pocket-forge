import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type { CombatActionCatalog, CombatMoveBindingSetPrimitives } from '@pocket-forge/combat-engine/domain';
import { CombatActionDescriptor, CombatMoveBindingSet } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

const POWER = AttributeDefinitionMother.number({
	constraints: { max: 100, min: 0 },
	defaultValue: 10,
	key: 'power',
});

const BANNER = AttributeDefinitionMother.string({
	constraints: { maxLength: 20, minLength: 1 },
	defaultValue: 'red',
	key: 'banner',
	required: true,
});

const TACKLE = CombatActionDescriptor.create('tackle', [POWER, BANNER]);

class TestActionCatalog implements CombatActionCatalog {
	constructor(private readonly descriptors: readonly CombatActionDescriptor[]) {}

	find(actionId: string): CombatActionDescriptor | undefined {
		return this.descriptors.find(descriptor => descriptor.id === actionId);
	}
}

const CATALOG = new TestActionCatalog([TACKLE]);

function primitives(overrides?: Partial<CombatMoveBindingSetPrimitives>): CombatMoveBindingSetPrimitives {
	return {
		bindings: [{ actionId: 'tackle', config: { power: 40 }, moveId: 'move-1' }],
		...overrides,
	};
}

describe('CombatMoveBindingSet', () => {
	describe('create', () => {
		it('accepts valid bindings', () => {
			const result = CombatMoveBindingSet.create(primitives(), CATALOG);

			expect(result.isRight()).toBe(true);

			const set = result.getRight();
			expect(set.bindings).toHaveLength(1);
			expect(set.bindings[0]?.moveId).toBe('move-1');
			expect(set.bindings[0]?.actionId).toBe('tackle');
			expect(set.bindings[0]?.config.toPrimitives()).toEqual({ banner: 'red', power: 40 });
		});

		it('rejects duplicate move bindings', () => {
			const result = CombatMoveBindingSet.create(
				primitives({
					bindings: [
						{ actionId: 'tackle', config: { power: 40 }, moveId: 'move-1' },
						{ actionId: 'tackle', config: { power: 50 }, moveId: 'move-1' },
					],
				}),
				CATALOG
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('duplicate-move-binding');
		});

		it('rejects unknown actions', () => {
			const result = CombatMoveBindingSet.create(
				primitives({ bindings: [{ actionId: 'missing', config: {}, moveId: 'move-1' }] }),
				CATALOG
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('unknown-action');
		});

		it('rejects invalid configuration', () => {
			const result = CombatMoveBindingSet.create(
				primitives({ bindings: [{ actionId: 'tackle', config: { power: 500 }, moveId: 'move-1' }] }),
				CATALOG
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-config');
		});

		it('rejects empty move ids', () => {
			const result = CombatMoveBindingSet.create(
				primitives({ bindings: [{ actionId: 'tackle', config: {}, moveId: '' }] }),
				CATALOG
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-move-id');
		});

		it('rejects empty action ids', () => {
			const result = CombatMoveBindingSet.create(
				primitives({ bindings: [{ actionId: '', config: {}, moveId: 'move-1' }] }),
				CATALOG
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action-id');
		});
	});

	describe('fromPrimitives', () => {
		it('hydrates without validating', () => {
			const source = primitives();
			const set = CombatMoveBindingSet.fromPrimitives(source);

			expect(set.toPrimitives()).toEqual(source);
		});
	});

	describe('find', () => {
		it('finds a binding by move id', () => {
			const set = CombatMoveBindingSet.create(primitives(), CATALOG).getRight();

			expect(set.find('move-1')?.actionId).toBe('tackle');
			expect(set.find('missing')).toBeUndefined();
		});
	});
});
