import type AttributeDefinition from '../attribute-definition';

/**
 * Contract for retrieving {@link AttributeDefinition} instances.
 *
 * Implementations may source definitions from in-memory catalogs,
 * JSON files, databases, or remote services.
 */
export default abstract class AttributeDefinitionRepository {
	/**
	 * Returns all available attribute definitions.
	 *
	 * @returns A promise that resolves to an array of definitions.
	 */
	abstract search(): Promise<AttributeDefinition[]>;
}
