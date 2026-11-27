import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { AttributeDefinitionPrimitives } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import JsonAttributeDefinitionRepository from '@pocket-forge/attribute/infrastructure';
import { afterEach, describe, expect, it } from 'bun:test';

const directories: string[] = [];

async function writeDefinitions(entries: unknown): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'pocket-forge-attribute-'));
	directories.push(directory);

	const filePath = path.join(directory, 'attributes.json');
	await Bun.write(filePath, JSON.stringify(entries));

	return filePath;
}

const recordDefinitions: AttributeDefinitionPrimitives[] = [
	{
		constraints: {
			fields: [
				{ constraints: { max: 100, min: 1 }, defaultValue: 100, key: 'chance', type: 'number' },
				{
					constraints: { validValues: ['burn', 'paralysis'] },
					defaultValue: 'burn',
					key: 'status',
					type: 'enum',
				},
			],
		},
		defaultValue: { chance: 100, status: 'burn' },
		key: 'secondary',
		type: 'record',
	},
	{
		constraints: {
			itemDefinition: {
				constraints: {
					fields: [
						{ constraints: {}, key: 'moveId', required: true, type: 'string' },
						{ constraints: { max: 64, min: 0 }, defaultValue: 35, key: 'current', type: 'number' },
					],
				},
				key: 'movePpEntry',
				type: 'record',
			},
		},
		defaultValue: [],
		key: 'movePp',
		type: 'array',
	},
];

afterEach(async () => {
	const created = [...directories];
	directories.length = 0;
	await Promise.all(created.map(directory => rm(directory, { force: true, recursive: true })));
});

describe('JsonAttributeDefinitionRepository', () => {
	it('loads flat definitions', async () => {
		const filePath = await writeDefinitions([
			{ constraints: { max: 255, min: 1 }, defaultValue: 10, key: 'power', required: true, type: 'number' },
		]);

		const definitions = await new JsonAttributeDefinitionRepository(filePath).search();

		expect(definitions).toHaveLength(1);
		expect(definitions[0]?.type).toBe('number');
		expect(definitions[0]?.defaultValue).toBe(10);
	});

	it('loads record definitions and arrays of records', async () => {
		const filePath = await writeDefinitions(recordDefinitions);

		const definitions = await new JsonAttributeDefinitionRepository(filePath).search();

		expect(definitions).toHaveLength(2);
		expect(definitions[0]?.type).toBe('record');
		expect(definitions[0]?.constraints.fields?.[0]).toBeInstanceOf(AttributeDefinition);
		expect(definitions[0]?.toPrimitives()).toEqual(recordDefinitions[0]);
		expect(definitions[1]?.constraints.itemDefinition).toBeInstanceOf(AttributeDefinition);
		expect(definitions[1]?.toPrimitives()).toEqual(recordDefinitions[1]);
	});

	it('rejects record definitions whose fields are not an array', async () => {
		const filePath = await writeDefinitions([
			{ constraints: { fields: 'status' }, key: 'secondary', type: 'record' },
		]);

		// eslint-disable-next-line typescript/await-thenable -- bun:test rejects is thenable
		await expect(new JsonAttributeDefinitionRepository(filePath).search()).rejects.toThrow();
	});

	it('rejects definitions with an unknown type', async () => {
		const filePath = await writeDefinitions([{ constraints: {}, key: 'secondary', type: 'table' }]);

		// eslint-disable-next-line typescript/await-thenable -- bun:test rejects is thenable
		await expect(new JsonAttributeDefinitionRepository(filePath).search()).rejects.toThrow();
	});
});
