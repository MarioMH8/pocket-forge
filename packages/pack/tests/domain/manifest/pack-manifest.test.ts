import { PackManifest } from '@pocket-forge/pack/domain';
import { PackManifestMother } from '@pocket-forge/pack/mother/domain';
import { describe, expect, it } from 'bun:test';

describe('PackManifest', () => {
	it('keeps every field and round-trips through toPrimitives', () => {
		const primitives = PackManifestMother.primitives({
			contracts: { moves: 1, species: 2 },
			contributions: [
				{ kind: 'moves', path: 'content/moves.json' },
				{ kind: 'species', path: 'content/species.json' },
			],
			extensions: [
				{
					contractVersion: '1.0.0',
					id: 'reference',
					module: './pack.js',
					point: 'combat',
				},
			],
			id: 'core',
			version: '1.2.3',
		});

		const result = PackManifest.create(primitives);

		expect(result.isRight()).toBe(true);
		const manifest = result.getRight();
		expect(manifest.id).toBe('core');
		expect(manifest.version).toBe('1.2.3');
		expect(manifest.contributions).toEqual(primitives.contributions);
		expect(manifest.contracts).toEqual(primitives.contracts);
		expect(manifest.extensions).toEqual(primitives.extensions);
		expect(manifest.toPrimitives()).toEqual(primitives);
	});

	it('aggregates identity, contribution, contract, and extension failures with paths', () => {
		const result = PackManifest.create({
			contracts: { '': 0, items: 1.5, moves: -1 },
			contributions: [{ kind: '', path: ' ' }],
			extensions: [{ contractVersion: '', id: '', module: '', point: '' }],
			id: ' ',
			version: '',
		});

		expect(result.isLeft()).toBe(true);
		const errors = result.getLeft();
		const paths = errors.map(error => error.path);

		expect(paths).toContain('id');
		expect(paths).toContain('version');
		expect(paths).toContain('contributions.0.kind');
		expect(paths).toContain('contributions.0.path');
		expect(paths).toContain('contracts.moves');
		expect(paths).toContain('contracts.items');
		expect(paths).toContain('contracts.');
		expect(paths).toContain('extensions.0.point');
		expect(paths).toContain('extensions.0.id');
		expect(paths).toContain('extensions.0.contractVersion');
		expect(paths).toContain('extensions.0.module');
		expect(errors.map(error => error.reason)).toContain('invalid-id');
		expect(errors.map(error => error.reason)).toContain('invalid-version');
		expect(errors.map(error => error.reason)).toContain('invalid-contribution');
		expect(errors.map(error => error.reason)).toContain('invalid-contract');
		expect(errors.map(error => error.reason)).toContain('invalid-extension');
	});

	it('aggregates failures from every contribution and extension', () => {
		const result = PackManifest.create(
			PackManifestMother.primitives({
				contributions: [
					{ kind: 'moves', path: 'content/moves.json' },
					{ kind: '', path: '' },
				],
				extensions: [
					{ contractVersion: '1.0.0', id: 'ok', module: './ok.js', point: 'combat' },
					{ contractVersion: '', id: 'broken', module: '', point: '' },
				],
			})
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft().map(error => error.path)).toEqual([
			'contributions.1.kind',
			'contributions.1.path',
			'extensions.1.point',
			'extensions.1.contractVersion',
			'extensions.1.module',
		]);
	});

	it('rejects a non-safe-integer contract value', () => {
		const result = PackManifest.create(
			PackManifestMother.primitives({
				contracts: { moves: Number.MAX_SAFE_INTEGER + 1 },
			})
		);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('invalid-contract');
		expect(result.getLeft()[0]?.path).toBe('contracts.moves');
	});
});
