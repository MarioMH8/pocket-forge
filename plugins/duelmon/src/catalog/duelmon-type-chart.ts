import Either from '@hexadrop/either';

import type { DuelmonType } from '../duelmon.types';
import { DuelmonTypes } from '../duelmon.types';
import { DuelmonCatalogError } from './duelmon-catalog.error';

const EFFECTIVENESS = [1, 2, 0.5, 0] as const;

type TypeChartPrimitives = Readonly<Record<string, Readonly<Record<string, number>>>>;
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRow(
	defenderType: DuelmonType,
	relations: UnknownRecord,
	errors: DuelmonCatalogError[]
): ReadonlyMap<DuelmonType, number> {
	const row = new Map<DuelmonType, number>();

	for (const attackType of DuelmonTypes.ALL) {
		const value = relations[attackType];
		const multiplier =
			typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 3
				? EFFECTIVENESS[value]
				: undefined;

		if (multiplier === undefined) {
			errors.push(
				new DuelmonCatalogError(
					'invalid-type-chart',
					`Invalid Duelmon type chart: ${attackType} against ${defenderType} must be 0, 1, 2, or 3`,
					`typechart.${defenderType}.${attackType}`
				)
			);
			continue;
		}

		row.set(attackType, multiplier);
	}

	return row;
}
type MultiplierTable = ReadonlyMap<DuelmonType, ReadonlyMap<DuelmonType, number>>;

/**
 * Validated Gen 1 defensive type chart.
 *
 * The chart is built once from the dataset and always contains every one of
 * the fifteen defender types with a relation for every attack type. Actions
 * can therefore ask for multipliers without handling validation failures.
 */
class DuelmonTypeChart {
	private readonly table: MultiplierTable;

	private constructor(table: MultiplierTable) {
		this.table = table;
	}

	/**
	 * Validates a dataset type chart and builds the multiplier table.
	 *
	 * @param typechart - Showdown-coded type chart, keyed by defender type.
	 * @returns The validated chart, or every missing or invalid relation.
	 */
	static fromDataset(typechart: TypeChartPrimitives): Either<DuelmonCatalogError[], DuelmonTypeChart> {
		const errors: DuelmonCatalogError[] = [];
		const table = new Map<DuelmonType, ReadonlyMap<DuelmonType, number>>();

		for (const defenderType of DuelmonTypes.ALL) {
			const relations: unknown = typechart[defenderType];

			if (!isRecord(relations)) {
				errors.push(
					new DuelmonCatalogError(
						'invalid-type-chart',
						`Invalid Duelmon type chart: missing defender type "${defenderType}"`,
						`typechart.${defenderType}`
					)
				);
				continue;
			}

			table.set(defenderType, readRow(defenderType, relations, errors));
		}

		return errors.length > 0 ? Either.left(errors) : Either.right(new DuelmonTypeChart(table));
	}

	/**
	 * Resolves one multiplier per defending type, in order.
	 *
	 * @param moveType - Attacking type.
	 * @param defenderTypes - One or two defending types.
	 * @returns The multiplier for every defender type.
	 */
	multipliers(moveType: DuelmonType, defenderTypes: readonly DuelmonType[]): readonly number[] {
		return defenderTypes.map(defenderType => this.table.get(defenderType)?.get(moveType) ?? 1);
	}
}

export type { TypeChartPrimitives };
export { DuelmonTypeChart };

export default DuelmonTypeChart;
