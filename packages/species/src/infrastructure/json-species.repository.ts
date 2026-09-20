import type { AttributeValue } from '@pocket-forge/attribute/domain';
import type { SpeciesRepository } from '@pocket-forge/species/domain';
import { Species } from '@pocket-forge/species/domain';
import { z } from 'zod';

const attributeValueSchema: z.ZodType<AttributeValue> = z.union([
	z.boolean(),
	z.number(),
	z.string(),
	z.array(z.boolean()),
	z.array(z.number()),
	z.array(z.string()),
]);

const speciesSchema = z.object({
	attributes: z.record(attributeValueSchema),
	id: z.string().min(1),
	name: z.string().min(1),
});

/**
 * JSON-file implementation of {@link SpeciesRepository}.
 *
 * Reads species catalog entries from a JSON file whose path is provided
 * at construction time. The file is read once on each {@link search} call
 * and validated with Zod.
 */
export default class JsonSpeciesRepository implements SpeciesRepository {
	constructor(private readonly filePath: string) {}

	async search(): Promise<Species[]> {
		const file = Bun.file(this.filePath);
		const raw: unknown = await file.json();
		const parsed = z.array(speciesSchema).parse(raw);

		return parsed.map(entry => Species.fromPrimitives(entry));
	}
}
