import type Species from '../species';

/**
 * Contract for retrieving {@link Species} catalog entries.
 *
 * Implementations may source species from in-memory catalogs,
 * JSON files, databases, or remote services.
 */
export default abstract class SpeciesRepository {
	/**
	 * Returns all available species.
	 *
	 * @returns A promise that resolves to an array of species.
	 */
	abstract search(): Promise<Species[]>;
}
