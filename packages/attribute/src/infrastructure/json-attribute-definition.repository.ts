import type {
	AttributeConstraintsPrimitives,
	AttributeDefinition,
	AttributeDefinitionPrimitives,
	AttributeDefinitionRepository,
	AttributeRecord,
	AttributeValue,
} from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionClass } from '@pocket-forge/attribute/domain';
import { z } from 'zod';

const attributeRecordSchema: z.ZodType<AttributeRecord> = z.lazy(() =>
	// eslint-disable-next-line no-use-before-define -- recursive schema
	z.record(attributeValueSchema)
);

const attributeValueSchema: z.ZodType<AttributeValue> = z.lazy(() =>
	z.union([
		z.boolean(),
		z.number(),
		z.string(),
		z.array(z.boolean()),
		z.array(z.number()),
		z.array(z.string()),
		attributeRecordSchema,
		z.array(attributeRecordSchema),
	])
);

const attributeConstraintsSchema: z.ZodType<AttributeConstraintsPrimitives> = z.lazy(() =>
	z.object({
		// eslint-disable-next-line no-use-before-define -- recursive schema
		fields: z.array(attributeDefinitionSchema).optional(),
		// eslint-disable-next-line no-use-before-define -- recursive schema
		itemDefinition: attributeDefinitionSchema.optional(),
		itemType: z.enum(['boolean', 'number', 'string']).optional(),
		max: z.number().optional(),
		maxLength: z.number().optional(),
		min: z.number().optional(),
		minLength: z.number().optional(),
		validValues: z.array(z.string()).optional(),
	})
);

const attributeDefinitionSchema: z.ZodType<AttributeDefinitionPrimitives> = z.lazy(() =>
	z.object({
		constraints: attributeConstraintsSchema,
		defaultValue: attributeValueSchema.optional(),
		key: z.string().min(1),
		required: z.boolean().optional(),
		type: z.enum(['array', 'boolean', 'enum', 'number', 'record', 'string']),
	})
);

/**
 * JSON-file implementation of {@link AttributeDefinitionRepository}.
 *
 * Reads attribute definitions from a JSON file whose path is provided
 * at construction time. The file is read once on each {@link search} call
 * and validated with Zod. Record definitions are validated recursively,
 * including their nested `fields` and `itemDefinition`.
 */
export default class JsonAttributeDefinitionRepository implements AttributeDefinitionRepository {
	constructor(private readonly filePath: string) {}

	async search(): Promise<AttributeDefinition[]> {
		const file = Bun.file(this.filePath);
		const raw: unknown = await file.json();
		const parsed = z.array(attributeDefinitionSchema).parse(raw);

		return parsed.map(entry => AttributeDefinitionClass.fromPrimitives(entry));
	}
}
