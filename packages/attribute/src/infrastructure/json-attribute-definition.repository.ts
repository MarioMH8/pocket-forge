import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeDefinition, AttributeDefinitionRepository } from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionClass } from '@pocket-forge/attribute/domain';
import { z } from 'zod';

const attributeConstraintsSchema = z.object({
	itemType: z.enum(['boolean', 'number', 'string']).optional(),
	max: z.number().optional(),
	maxLength: z.number().optional(),
	min: z.number().optional(),
	minLength: z.number().optional(),
	validValues: z.array(z.string()).optional(),
});

const attributeValueUnion = z.union([
	z.boolean(),
	z.number(),
	z.string(),
	z.array(z.boolean()),
	z.array(z.number()),
	z.array(z.string()),
]);

const attributeDefinitionSchema = z.object({
	constraints: attributeConstraintsSchema,
	defaultValue: attributeValueUnion.optional(),
	key: z.string().min(1),
	required: z.boolean().optional(),
	type: z.enum(['array', 'boolean', 'enum', 'number', 'string']),
});

type AttributeDefinitionPrimitives = Primitives<AttributeDefinition>;

/**
 * JSON-file implementation of {@link AttributeDefinitionRepository}.
 *
 * Reads attribute definitions from a JSON file whose path is provided
 * at construction time. The file is read once on each {@link search} call
 * and validated with Zod.
 */
export default class JsonAttributeDefinitionRepository implements AttributeDefinitionRepository {
	constructor(private readonly filePath: string) {}

	async search(): Promise<AttributeDefinition[]> {
		const file = Bun.file(this.filePath);
		const raw: unknown = await file.json();
		const parsed = z.array(attributeDefinitionSchema).parse(raw);

		return parsed.map(entry => AttributeDefinitionClass.fromPrimitives(entry as AttributeDefinitionPrimitives));
	}
}
