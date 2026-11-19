import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import type {
	CombatActionCatalog,
	CombatActionDescriptor,
	CombatActionSetPrimitives,
} from '@pocket-forge/combat/domain';
import { CombatActionSet } from '@pocket-forge/combat/domain';
import { describe, expect, it } from 'bun:test';

const POWER = AttributeDefinitionMother.number({
	constraints: { max: 10, min: 1 },
	defaultValue: 2,
	key: 'power',
	required: true,
});

const REQUIRED_POWER = AttributeDefinition.create({
	constraints: { max: 10, min: 1 },
	key: 'power',
	required: true,
	type: 'number',
});

const TACKLE: CombatActionDescriptor = {
	configDefinitions: [POWER],
	id: 'tackle',
};

const STRIKE: CombatActionDescriptor = {
	configDefinitions: [POWER],
	id: 'strike',
	validateConfig: config => (config['power'] === 3 ? ['Power cannot be 3'] : []),
};

class TestActionCatalog implements CombatActionCatalog {
	constructor(private readonly descriptors: readonly CombatActionDescriptor[]) {}

	find(actionId: string): CombatActionDescriptor | undefined {
		return this.descriptors.find(descriptor => descriptor.id === actionId);
	}
}

const CATALOG = new TestActionCatalog([TACKLE, STRIKE]);

function primitives(overrides?: Partial<CombatActionSetPrimitives>): CombatActionSetPrimitives {
	return {
		bindings: [{ actionId: 'tackle', config: { power: 5 }, moveId: 'move-1' }],
		plugin: { id: 'test-plugin' },
		...overrides,
	};
}

function create(overrides?: Partial<CombatActionSetPrimitives>) {
	return CombatActionSet.create(primitives(overrides), CATALOG);
}

describe('CombatActionSet', () => {
	describe('create', () => {
		it('stores validated plugin identity and bindings', () => {
			const result = create();

			expect(result.isRight()).toBe(true);

			const actionSet = result.getRight();
			expect(actionSet.plugin).toEqual({ id: 'test-plugin' });
			expect(actionSet.bindings).toHaveLength(1);
			expect(actionSet.find('move-1')?.actionId).toBe('tackle');
			expect(actionSet.find('move-1')?.config.toPrimitives()).toEqual({ power: 5 });
			expect(actionSet.find('unknown-move')).toBeUndefined();
		});

		it('applies action config defaults', () => {
			const result = create({
				bindings: [{ actionId: 'tackle', config: {}, moveId: 'move-1' }],
			});

			expect(result.getRight().find('move-1')?.config.toPrimitives()).toEqual({ power: 2 });
		});

		it('rejects an empty plugin id', () => {
			const result = create({ plugin: { id: ' ' } });

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-plugin-id');
			expect(result.getLeft()[0]?.path).toBe('plugin.id');
		});

		it('rejects an empty Move id', () => {
			const result = create({
				bindings: [{ actionId: 'tackle', config: { power: 5 }, moveId: '' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-move-id');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.moveId');
		});

		it('rejects an empty action id', () => {
			const result = create({
				bindings: [{ actionId: '', config: { power: 5 }, moveId: 'move-1' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-action-id');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.actionId');
		});

		it('rejects duplicated Move ids', () => {
			const result = create({
				bindings: [
					{ actionId: 'tackle', config: { power: 5 }, moveId: 'move-1' },
					{ actionId: 'strike', config: { power: 4 }, moveId: 'move-1' },
				],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('duplicate-move-binding');
			expect(result.getLeft()[0]?.path).toBe('bindings.1.moveId');
		});

		it('rejects an unknown action', () => {
			const result = create({
				bindings: [{ actionId: 'missing', config: {}, moveId: 'move-1' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('unknown-action');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.actionId');
		});

		it('rejects a config key without a definition', () => {
			const result = create({
				bindings: [{ actionId: 'tackle', config: { extra: true, power: 5 }, moveId: 'move-1' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-config');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.config.extra');
		});

		it('rejects a missing required config value', () => {
			const catalog = new TestActionCatalog([{ configDefinitions: [REQUIRED_POWER], id: 'strike' }]);

			const result = CombatActionSet.create(
				primitives({ bindings: [{ actionId: 'strike', config: {}, moveId: 'move-1' }] }),
				catalog
			);

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-config');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.config.power');
			expect(result.getLeft()[0]?.message).toContain('is required');
		});

		it('rejects a config value that fails its definition', () => {
			const result = create({
				bindings: [{ actionId: 'tackle', config: { power: 99 }, moveId: 'move-1' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-config');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.config.power');
			expect(result.getLeft()[0]?.message).toContain('exceeds maximum 10');
		});

		it('rejects action config through validateConfig', () => {
			const result = create({
				bindings: [{ actionId: 'strike', config: { power: 3 }, moveId: 'move-1' }],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-config');
			expect(result.getLeft()[0]?.path).toBe('bindings.0.config');
			expect(result.getLeft()[0]?.message).toBe('Power cannot be 3');
		});

		it('aggregates every validation failure', () => {
			const result = create({
				bindings: [
					{ actionId: 'tackle', config: { power: 5 }, moveId: 'move-1' },
					{ actionId: 'missing', config: {}, moveId: 'move-1' },
					{ actionId: '', config: {}, moveId: '' },
				],
				plugin: { id: '' },
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.reason)).toEqual([
				'invalid-plugin-id',
				'duplicate-move-binding',
				'unknown-action',
				'invalid-move-id',
				'invalid-action-id',
			]);
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const source = primitives();

			const actionSet = CombatActionSet.fromPrimitives(source);

			expect(actionSet.toPrimitives()).toEqual(source);
			expect(actionSet.find('move-1')?.actionId).toBe('tackle');
		});
	});
});
