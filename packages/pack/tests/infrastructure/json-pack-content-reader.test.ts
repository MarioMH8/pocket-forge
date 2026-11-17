import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { JsonPackContentReader } from '@pocket-forge/pack/infrastructure';
import { afterEach, describe, expect, it } from 'bun:test';

const contribution = { kind: 'moves', path: 'content/moves.json' };

describe('JsonPackContentReader', () => {
	const reader = new JsonPackContentReader();
	let directory: string | undefined;

	afterEach(async () => {
		const current = directory;
		directory = undefined;

		if (!current) {
			return;
		}

		await rm(current, { force: true, recursive: true });
	});

	it('reads an array from a file relative to the pack root', async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'pocket-forge-pack-'));
		const entries = [{ id: 'fire', name: 'Fire' }];
		await mkdir(path.join(directory, 'content'), { recursive: true });
		await writeFile(path.join(directory, 'content/moves.json'), JSON.stringify(entries));

		const result = await reader.read(directory, contribution);

		expect(result.isRight()).toBe(true);
		expect(result.getRight()).toEqual(entries);
	});

	it('returns content-read-failed when the file is missing', async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'pocket-forge-pack-'));

		const result = await reader.read(directory, contribution);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('content-read-failed');
		expect(result.getLeft()[0]?.path).toBe('content/moves.json');
	});

	it('returns content-read-failed when the JSON is invalid', async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'pocket-forge-pack-'));
		await mkdir(path.join(directory, 'content'), { recursive: true });
		await writeFile(path.join(directory, 'content/moves.json'), '{ not json');

		const result = await reader.read(directory, contribution);

		expect(result.isLeft()).toBe(true);
		expect(result.getLeft()[0]?.reason).toBe('content-read-failed');
		expect(result.getLeft()[0]?.path).toBe('content/moves.json');
	});
});
