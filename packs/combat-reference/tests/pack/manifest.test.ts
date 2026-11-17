import type { PackManifestPrimitives } from '@pocket-forge/pack/domain';
import { PackManifest } from '@pocket-forge/pack/domain';
import { describe, expect, it } from 'bun:test';

const MANIFEST_PATH = new URL('../../manifest.json', import.meta.url);

describe('combat-reference manifest', () => {
	it('validates as a Pack Manifest', async () => {
		const primitives = (await Bun.file(MANIFEST_PATH).json()) as PackManifestPrimitives;
		const result = PackManifest.create(primitives);

		expect(result.isRight()).toBe(true);
	});

	it('declares the pack identity and version', async () => {
		const primitives = (await Bun.file(MANIFEST_PATH).json()) as PackManifestPrimitives;
		const manifest = PackManifest.create(primitives).getRight();

		expect(manifest.id).toBe('@pocket-forge/combat-reference');
		expect(manifest.version).toBe('0.0.0');
	});

	it('declares the reference combat action-plugin extension', async () => {
		const primitives = (await Bun.file(MANIFEST_PATH).json()) as PackManifestPrimitives;
		const manifest = PackManifest.create(primitives).getRight();

		expect(manifest.extensions).toEqual([
			{
				contractVersion: '1.0.0',
				id: 'pocket-forge.reference',
				module: './domain',
				point: 'combat.action-plugin',
			},
		]);
	});
});
