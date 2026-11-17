import type {
	Binding,
	Contribution,
	PackExtensionDeclaration,
	PackSelection,
	ResolveInput,
} from '@pocket-forge/pack/domain';
import { PackResolver, token } from '@pocket-forge/pack/domain';
import { FakePackContentReader } from '@pocket-forge/pack/mock/domain';
import { PackManifestMother } from '@pocket-forge/pack/mother/domain';
import { describe, expect, it } from 'bun:test';

interface PackOptions {
	readonly bindings?: readonly Binding[];
	readonly contracts?: Readonly<Record<string, number>>;
	readonly contributions?: readonly Contribution[];
	readonly extensions?: readonly PackExtensionDeclaration[];
}

function pack(id: string, options: PackOptions = {}): PackSelection {
	return {
		bindings: options.bindings ?? [],
		manifest: PackManifestMother.create({
			contracts: options.contracts ?? {},
			contributions: options.contributions ?? [],
			extensions: options.extensions ?? [],
			id,
		}),
		root: id,
	};
}

function movesContribution(): { kind: string; path: string } {
	return { kind: 'moves', path: 'content/moves.json' };
}

describe('PackResolver', () => {
	it('merges disjoint kinds and ids from two packs', async () => {
		const reader = new FakePackContentReader({
			'a/content/moves.json': [{ id: 'fire', name: 'Fire' }],
			'b/content/species.json': [{ id: 'leaf', name: 'Leaf' }],
		});
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1], species: [1] },
			packs: [
				pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
				pack('b', {
					contracts: { species: 1 },
					contributions: [{ kind: 'species', path: 'content/species.json' }],
				}),
			],
		});

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		expect(definition.content.find('moves', 'fire')?.source).toBe('a');
		expect(definition.content.find('species', 'leaf')?.source).toBe('b');
		expect(definition.provenance.content).toEqual([
			{ id: 'fire', kind: 'moves', sources: ['a'] },
			{ id: 'leaf', kind: 'species', sources: ['b'] },
		]);
	});

	it('rejects a contribution whose kind the project does not accept', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { species: [1] },
			packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
		});

		expect(result.isLeft()).toBe(true);
		const errors = result.getLeft();
		expect(errors).toHaveLength(1);
		expect(errors[0]?.reason).toBe('unknown-kind');
		expect(errors[0]?.packId).toBe('a');
	});

	it('rejects a pack that does not declare a contract for its kind', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			packs: [pack('a', { contracts: {}, contributions: [movesContribution()] })],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['missing-contract']);
	});

	it('rejects a contract version the project does not accept', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [2] },
			packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['unsupported-contract']);
	});

	it('rejects a content id claimed by two packs and names both packs', async () => {
		const reader = new FakePackContentReader({
			'a/content/moves.json': [{ id: 'fire', name: 'Fire' }],
			'b/content/moves.json': [{ id: 'fire', name: 'Flame' }],
		});
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			packs: [
				pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
				pack('b', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
			],
		});

		expect(result.isLeft()).toBe(true);
		const errors = result.getLeft();
		expect(errors).toHaveLength(1);
		expect(errors[0]?.reason).toBe('duplicate-content-id');
		expect(errors[0]?.message).toContain('a');
		expect(errors[0]?.message).toContain('b');
	});

	it('applies a replace override that resolves a duplicate', async () => {
		const reader = new FakePackContentReader({
			'a/content/moves.json': [{ id: 'fire', name: 'Fire' }],
			'b/content/moves.json': [{ id: 'fire', name: 'Flame' }],
		});
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			overrides: [
				{ id: 'fire', kind: 'moves', operation: 'replace', value: { id: 'fire', name: 'Project Fire' } },
			],
			packs: [
				pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
				pack('b', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
			],
		});

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		const entry = definition.content.find('moves', 'fire');
		expect(definition.content.get('moves')).toHaveLength(1);
		expect(entry?.source).toBe('project');
		expect(entry?.value['name']).toBe('Project Fire');
		expect(definition.provenance.content).toEqual([{ id: 'fire', kind: 'moves', sources: ['project'] }]);
	});

	it('applies a remove override that deletes the entry', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			overrides: [{ id: 'fire', kind: 'moves', operation: 'remove' }],
			packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
		});

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		expect(definition.content.find('moves', 'fire')).toBeUndefined();
		expect(definition.provenance.content).toEqual([]);
	});

	it('rejects an override for an unknown id', async () => {
		const resolver = new PackResolver(new FakePackContentReader());

		const result = await resolver.resolve({
			acceptedContracts: {},
			overrides: [{ id: 'missing', kind: 'moves', operation: 'remove' }],
			packs: [pack('a')],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['invalid-override']);
	});

	it('rejects a duplicated override target', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			overrides: [
				{ id: 'fire', kind: 'moves', operation: 'replace', value: { id: 'fire', name: 'One' } },
				{ id: 'fire', kind: 'moves', operation: 'remove' },
			],
			packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['invalid-override']);
	});

	it('rejects a replace value whose id differs from the override id', async () => {
		const reader = new FakePackContentReader({ 'a/content/moves.json': [{ id: 'fire' }] });
		const resolver = new PackResolver(reader);

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			overrides: [{ id: 'fire', kind: 'moves', operation: 'replace', value: { id: 'other' } }],
			packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['invalid-override']);
	});

	it('rejects a duplicated extension point and id', async () => {
		const extension = {
			contractVersion: '1.0.0',
			id: 'reference',
			module: './pack.js',
			point: 'combat',
		};
		const resolver = new PackResolver(new FakePackContentReader());

		const result = await resolver.resolve({
			acceptedContracts: {},
			packs: [pack('a', { extensions: [extension] }), pack('b', { extensions: [extension] })],
		});

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.reason)).toEqual(['duplicate-extension']);
	});

	it('lets a later pack shadow a binding and records the warning and provenance', async () => {
		const capability = token<{ value: string }>('CombatSetup');
		const resolver = new PackResolver(new FakePackContentReader());

		const result = await resolver.resolve({
			acceptedContracts: {},
			packs: [
				pack('a', { bindings: [{ capability, create: () => ({ value: 'a' }) }] }),
				pack('b', { bindings: [{ capability, create: () => ({ value: 'b' }) }] }),
			],
		});

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		expect(definition.bindings).toHaveLength(1);
		expect(definition.bindings[0]?.create(definition.content)).toEqual({ value: 'b' });
		expect(definition.diagnostics).toHaveLength(1);
		expect(definition.diagnostics[0]?.reason).toBe('shadowed-binding');
		expect(definition.provenance.bindings).toEqual([{ capability: 'CombatSetup', shadowed: ['a'], winner: 'b' }]);
	});

	it('lets a project binding win over every pack', async () => {
		const capability = token<{ value: string }>('CombatSetup');
		const resolver = new PackResolver(new FakePackContentReader());

		const result = await resolver.resolve({
			acceptedContracts: {},
			bindings: [{ capability, create: () => ({ value: 'project' }) }],
			packs: [pack('a', { bindings: [{ capability, create: () => ({ value: 'a' }) }] })],
		});

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		expect(definition.bindings[0]?.create(definition.content)).toEqual({ value: 'project' });
		expect(definition.diagnostics[0]?.reason).toBe('shadowed-binding');
		expect(definition.provenance.bindings).toEqual([
			{ capability: 'CombatSetup', shadowed: ['a'], winner: 'project' },
		]);
	});

	it('uses a class as a capability and resolves it by identity', async () => {
		abstract class CombatSetup {
			abstract value(): string;
		}
		class PackSetup extends CombatSetup {
			override value(): string {
				return 'pack';
			}
		}
		class ProjectSetup extends CombatSetup {
			override value(): string {
				return 'project';
			}
		}
		const resolver = new PackResolver(new FakePackContentReader());
		const input: ResolveInput = {
			acceptedContracts: {},
			bindings: [{ capability: CombatSetup, create: () => new ProjectSetup() }],
			packs: [pack('a', { bindings: [{ capability: CombatSetup, create: () => new PackSetup() }] })],
		};

		const result = await resolver.resolve(input);

		expect(result.isRight()).toBe(true);
		const definition = result.getRight();
		expect(definition.bindings[0]?.create(definition.content)).toBeInstanceOf(ProjectSetup);
		expect(definition.provenance.bindings[0]?.capability).toBe('CombatSetup');
	});

	it('aggregates every reader failure', async () => {
		const resolver = new PackResolver(new FakePackContentReader());

		const result = await resolver.resolve({
			acceptedContracts: { moves: [1] },
			packs: [
				pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
				pack('b', { contracts: { moves: 1 }, contributions: [movesContribution()] }),
			],
		});

		expect(result.isLeft()).toBe(true);
		const errors = result.getLeft();
		expect(errors).toHaveLength(2);
		expect(errors.every(error => error.reason === 'content-read-failed')).toBe(true);
		expect(errors.map(error => error.path)).toEqual(['content/moves.json', 'content/moves.json']);
	});

	describe('invalid envelope', () => {
		it('rejects a contribution that is not an array', async () => {
			const reader = new FakePackContentReader({ 'a/content/moves.json': { id: 'fire' } });
			const resolver = new PackResolver(reader);

			const result = await resolver.resolve({
				acceptedContracts: { moves: [1] },
				packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft()[0]?.reason).toBe('invalid-content');
			expect(result.getLeft()[0]?.packId).toBe('a');
		});

		it('rejects an entry without a non-empty string id', async () => {
			const reader = new FakePackContentReader({ 'a/content/moves.json': [{ name: 'Fire' }, undefined] });
			const resolver = new PackResolver(reader);

			const result = await resolver.resolve({
				acceptedContracts: { moves: [1] },
				packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.reason)).toEqual(['invalid-content', 'invalid-content']);
		});

		it('rejects a duplicated id inside one contribution', async () => {
			const reader = new FakePackContentReader({
				'a/content/moves.json': [{ id: 'fire' }, { id: 'fire' }],
			});
			const resolver = new PackResolver(reader);

			const result = await resolver.resolve({
				acceptedContracts: { moves: [1] },
				packs: [pack('a', { contracts: { moves: 1 }, contributions: [movesContribution()] })],
			});

			expect(result.isLeft()).toBe(true);
			expect(result.getLeft().map(error => error.reason)).toEqual(['invalid-content']);
		});
	});
});
