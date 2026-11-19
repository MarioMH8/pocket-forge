import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionEntity } from '@pocket-forge/attribute/domain';

import type { DuelmonMoveCategory, DuelmonType } from '../duelmon.types';
import { DuelmonTypes } from '../duelmon.types';

/**
 * Attribute definitions that describe entities built from the Duelmon dataset.
 *
 * The definitions are catalog-owned: they validate the neutral Species and
 * Move entities that the dataset catalog exposes, and never leak into the
 * dataset shape itself. Battle-stat definitions are generation-specific and
 * live with their mechanics, for example `Gen1BattleStats.DEFINITIONS`.
 */
class DuelmonAttributeDefinitions {
	/**
	 * Move categories accepted by the dataset catalog.
	 */
	static readonly MOVE_CATEGORIES: readonly DuelmonMoveCategory[] = DuelmonTypes.MOVE_CATEGORIES;
	/**
	 * Gen 1 types accepted by the dataset catalog.
	 */
	static readonly TYPES: readonly DuelmonType[] = DuelmonTypes.ALL;
	/**
	 * Attributes that describe a neutral Move built from the dataset.
	 */
	static readonly move: readonly AttributeDefinition[] = Object.freeze([
		AttributeDefinitionEntity.create({
			constraints: { validValues: [...DuelmonTypes.ALL] },
			key: 'type',
			required: true,
			type: 'enum',
		}),
		AttributeDefinitionEntity.create({
			constraints: { validValues: [...DuelmonTypes.MOVE_CATEGORIES] },
			key: 'category',
			required: true,
			type: 'enum',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 250, min: 0 },
			key: 'power',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 100, min: 1 },
			key: 'accuracy',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: {},
			key: 'alwaysHits',
			required: true,
			type: 'boolean',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 64, min: 1 },
			key: 'pp',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 7, min: -7 },
			key: 'priority',
			required: true,
			type: 'number',
		}),
	]);

	/**
	 * Attributes that describe a neutral Species built from the dataset.
	 */
	static readonly species: readonly AttributeDefinition[] = Object.freeze([
		AttributeDefinitionEntity.create({
			constraints: { itemType: 'string', maxLength: 2, minLength: 1 },
			key: 'types',
			required: true,
			type: 'array',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 255, min: 1 },
			key: 'baseHp',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 255, min: 1 },
			key: 'baseAtk',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 255, min: 1 },
			key: 'baseDef',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 255, min: 1 },
			key: 'baseSpecial',
			required: true,
			type: 'number',
		}),
		AttributeDefinitionEntity.create({
			constraints: { max: 255, min: 1 },
			key: 'baseSpeed',
			required: true,
			type: 'number',
		}),
	]);
}

export { DuelmonAttributeDefinitions };

export default DuelmonAttributeDefinitions;

export { type DuelmonMoveCategory, type DuelmonType } from '../duelmon.types';
