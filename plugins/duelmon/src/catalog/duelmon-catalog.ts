import Either from '@hexadrop/either';
import type { DuelmonDataset, DuelmonMove, DuelmonType } from '@pocket-forge/duelmon-dataset';
import type { Move } from '@pocket-forge/move/domain';
import type { Species } from '@pocket-forge/species/domain';

import { DuelmonCatalogError } from './duelmon-catalog.error';
import { DuelmonCatalogMapper } from './duelmon-catalog.mapper';
import { DuelmonTypeChart } from './duelmon-type-chart';

/**
 * Neutral catalog built from the private Duelmon Gen 1 dataset.
 *
 * The catalog is built once at startup. Every entry and every type-chart
 * relation is validated at that boundary, so lookups never throw and the
 * action layer receives plain values.
 */
class DuelmonCatalog {
	/**
	 * Moves mapped to neutral catalog entities.
	 */
	readonly moves: readonly Move[];
	/**
	 * Species mapped to neutral catalog entities.
	 */
	readonly species: readonly Species[];
	private readonly moveEntriesById: ReadonlyMap<string, DuelmonMove>;
	private readonly movesById: ReadonlyMap<string, Move>;
	private readonly speciesById: ReadonlyMap<string, Species>;
	private readonly typeChart: DuelmonTypeChart;

	private constructor(
		moves: readonly Move[],
		moveEntries: readonly DuelmonMove[],
		species: readonly Species[],
		typeChart: DuelmonTypeChart
	) {
		this.moves = moves;
		this.species = species;
		this.movesById = new Map(moves.map(move => [move.id, move]));
		this.moveEntriesById = new Map(moveEntries.map(entry => [entry.id, entry]));
		this.speciesById = new Map(species.map(speciesEntry => [speciesEntry.id, speciesEntry]));
		this.typeChart = typeChart;
	}

	/**
	 * Builds the neutral Duelmon catalog from the private Gen 1 dataset.
	 *
	 * @param dataset - Curated Gen 1 dataset.
	 * @returns The neutral catalog, or every invalid dataset entry.
	 * @example
	 * ```ts
	 * const catalog = DuelmonCatalog.fromDataset(dataset).getRight();
	 *
	 * catalog.findSpecies('bulbasaur')?.id; // 'bulbasaur'
	 * catalog.typeMultipliers('Ice', ['Water', 'Flying']); // [0.5, 2]
	 * ```
	 */
	static fromDataset(dataset: DuelmonDataset): Either<DuelmonCatalogError[], DuelmonCatalog> {
		const typeChart = DuelmonTypeChart.fromDataset(dataset.typechart);
		const moves = DuelmonCatalogMapper.moves(dataset.moves);
		const species = DuelmonCatalogMapper.species(dataset.species);
		const errors: DuelmonCatalogError[] = [
			...(typeChart.isLeft() ? typeChart.getLeft() : []),
			...(moves.isLeft() ? moves.getLeft() : []),
			...(species.isLeft() ? species.getLeft() : []),
		];

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(
			new DuelmonCatalog(moves.getRight(), dataset.moves, species.getRight(), typeChart.getRight())
		);
	}

	/**
	 * Finds a move by its dataset identifier.
	 *
	 * @param id - Move identifier.
	 * @returns The matching move, or `undefined` when it is unknown.
	 */
	findMove(id: string): Move | undefined {
		return this.movesById.get(id);
	}

	/**
	 * Finds the source dataset entry of a move.
	 *
	 * The neutral Move drops effects such as primary status, secondary effects,
	 * and stat-stage changes. Consumers that validate content support read the
	 * source entry instead of duplicating the dataset.
	 *
	 * @param id - Move identifier.
	 * @returns The matching dataset entry, or `undefined` when it is unknown.
	 */
	findMoveEntry(id: string): DuelmonMove | undefined {
		return this.moveEntriesById.get(id);
	}

	/**
	 * Finds a species by its dataset identifier.
	 *
	 * @param id - Species identifier.
	 * @returns The matching species, or `undefined` when it is unknown.
	 */
	findSpecies(id: string): Species | undefined {
		return this.speciesById.get(id);
	}

	/**
	 * Resolves the Gen 1 type multiplier for every defending type.
	 *
	 * The per-type list is what the damage formula needs: Gen 1 truncates
	 * after applying each defender type in order, so the combined product is
	 * not equivalent.
	 *
	 * @param moveType - Attacking type.
	 * @param defenderTypes - One or two defending types.
	 * @returns One multiplier (0, 0.5, or 2) per defender type, in order.
	 */
	typeMultipliers(moveType: DuelmonType, defenderTypes: readonly DuelmonType[]): readonly number[] {
		return this.typeChart.multipliers(moveType, defenderTypes);
	}
}

export { DuelmonCatalog };

export default DuelmonCatalog;
