import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import type { DuelmonMove, DuelmonMoveSecondary, DuelmonSpecies } from '@pocket-forge/duelmon-dataset';
import { DuelmonTypes } from '@pocket-forge/duelmon-dataset';
import { Move } from '@pocket-forge/move/domain';
import { Species } from '@pocket-forge/species/domain';

import { DuelmonAttributeDefinitions } from './duelmon-attribute-definitions';
import { DuelmonCatalogError } from './duelmon-catalog.error';

/**
 * Validates dataset entries and maps them to neutral catalog entities.
 *
 * Mapping is separated from catalog lookup and type-chart composition so the
 * catalog stays a small, cohesive lookup surface.
 */
class DuelmonCatalogMapper {
	/**
	 * Maps dataset moves to neutral Move entities.
	 *
	 * @param entries - Moves declared by the dataset.
	 * @param definitions - Definitions that govern Move attributes.
	 * @returns The mapped moves, or every invalid entry.
	 */
	static moves(
		entries: readonly DuelmonMove[],
		definitions: readonly AttributeDefinition[] = DuelmonAttributeDefinitions.MOVE
	): Either<DuelmonCatalogError[], readonly Move[]> {
		const errors: DuelmonCatalogError[] = [];
		const moves: Move[] = [];
		const ids = new Set<string>();

		for (const entry of entries) {
			if (ids.has(entry.id)) {
				errors.push(
					new DuelmonCatalogError(
						'duplicate-id',
						`Duplicated Duelmon move identifier "${entry.id}"`,
						`moves.${entry.id}`
					)
				);
				continue;
			}
			ids.add(entry.id);

			const declaredType: string = entry.type;

			if (!DuelmonTypes.is(declaredType)) {
				errors.push(
					new DuelmonCatalogError(
						'unknown-type',
						`Invalid Duelmon move "${entry.id}": unknown type "${declaredType}"`,
						`moves.${entry.id}.type`
					)
				);
				continue;
			}

			const values: AttributeValues = {
				accuracy: entry.accuracy === true ? 100 : entry.accuracy,
				alwaysHits: entry.accuracy === true,
				category: entry.category,
				power: entry.power,
				pp: entry.pp,
				priority: entry.priority,
				type: entry.type,
				...(entry.status !== undefined && { status: entry.status }),
				...(entry.volatileStatus !== undefined && { volatileStatus: entry.volatileStatus }),
				...(entry.boosts !== undefined && { boosts: this.boostValues(entry.boosts) }),
				...(entry.secondary !== undefined && { secondary: this.secondaryValues(entry.secondary) }),
				...(entry.drain !== undefined && { drain: [...entry.drain] }),
				...(entry.recoil !== undefined && { recoil: [...entry.recoil] }),
				...(entry.multihit !== undefined && { multihit: this.multihitValues(entry.multihit) }),
				...(entry.critRatio !== undefined && { critRatio: entry.critRatio }),
			};

			try {
				moves.push(Move.create(entry.id, values, [...definitions]));
			} catch (error) {
				errors.push(
					new DuelmonCatalogError(
						'invalid-move',
						`Invalid Duelmon move "${entry.id}": ${this.messageOf(error)}`,
						`moves.${entry.id}`
					)
				);
			}
		}

		return errors.length > 0 ? Either.left(errors) : Either.right(Object.freeze(moves));
	}

	/**
	 * Maps dataset species to neutral Species entities.
	 *
	 * @param entries - Species declared by the dataset.
	 * @param definitions - Definitions that govern Species attributes.
	 * @returns The mapped species, or every invalid entry.
	 */
	static species(
		entries: readonly DuelmonSpecies[],
		definitions: readonly AttributeDefinition[] = DuelmonAttributeDefinitions.SPECIES
	): Either<DuelmonCatalogError[], readonly Species[]> {
		const errors: DuelmonCatalogError[] = [];
		const species: Species[] = [];
		const ids = new Set<string>();

		for (const entry of entries) {
			if (ids.has(entry.id)) {
				errors.push(
					new DuelmonCatalogError(
						'duplicate-id',
						`Duplicated Duelmon species identifier "${entry.id}"`,
						`species.${entry.id}`
					)
				);
				continue;
			}
			ids.add(entry.id);

			const declaredTypes: readonly string[] = entry.types;
			const unknownType = declaredTypes.find(type => !DuelmonTypes.is(type));

			if (unknownType !== undefined) {
				errors.push(
					new DuelmonCatalogError(
						'unknown-type',
						`Invalid Duelmon species "${entry.id}": unknown type "${unknownType}"`,
						`species.${entry.id}.types`
					)
				);
				continue;
			}

			const values: AttributeValues = {
				baseAtk: entry.baseStats.atk,
				baseDef: entry.baseStats.def,
				baseHp: entry.baseStats.hp,
				baseSpecial: entry.baseStats.spa,
				baseSpeed: entry.baseStats.spe,
				types: [...entry.types],
			};

			try {
				species.push(Species.create(entry.id, values, [...definitions]));
			} catch (error) {
				errors.push(
					new DuelmonCatalogError(
						'invalid-species',
						`Invalid Duelmon species "${entry.id}": ${this.messageOf(error)}`,
						`species.${entry.id}`
					)
				);
			}
		}

		return errors.length > 0 ? Either.left(errors) : Either.right(Object.freeze(species));
	}

	private static boostValues(boosts: Readonly<Record<string, number>>): AttributeValues[] {
		return Object.entries(boosts).map(([stat, stages]) => ({ stages, stat }));
	}

	private static messageOf(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}

	private static multihitValues(multihit: number | readonly number[]): number[] {
		return typeof multihit === 'number' ? [multihit, multihit] : [...multihit];
	}

	private static secondaryValues(secondary: DuelmonMoveSecondary): AttributeValues {
		return {
			...(secondary.boosts !== undefined && { boosts: this.boostValues(secondary.boosts) }),
			...(secondary.chance !== undefined && { chance: secondary.chance }),
			...(secondary.self?.boosts !== undefined && { self: { boosts: this.boostValues(secondary.self.boosts) } }),
			...(secondary.status !== undefined && { status: secondary.status }),
			...(secondary.volatileStatus !== undefined && { volatileStatus: secondary.volatileStatus }),
		};
	}
}

export { DuelmonCatalogMapper };

export default DuelmonCatalogMapper;
