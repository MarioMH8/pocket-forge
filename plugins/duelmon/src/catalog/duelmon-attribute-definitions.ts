import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinition as AttributeDefinitionEntity } from '@pocket-forge/attribute/domain';
import { DuelmonTypes } from '@pocket-forge/duelmon-dataset';

const BOOST_FIELDS: readonly AttributeDefinition[] = Object.freeze([
	AttributeDefinitionEntity.create({
		constraints: { minLength: 1 },
		key: 'stat',
		required: true,
		type: 'string',
	}),
	AttributeDefinitionEntity.create({
		constraints: { max: 6, min: -6 },
		key: 'stages',
		required: true,
		type: 'number',
	}),
]);

/**
 * One stat-stage change, carried as a closed record.
 */
const BOOST: AttributeDefinition = AttributeDefinitionEntity.create({
	constraints: { fields: BOOST_FIELDS },
	key: 'boost',
	required: true,
	type: 'record',
});

/**
 * Stat-stage changes applied by a Move or a secondary effect.
 */
const BOOSTS: AttributeDefinition = AttributeDefinitionEntity.create({
	constraints: { itemDefinition: BOOST, maxLength: 6, minLength: 1 },
	key: 'boosts',
	required: false,
	type: 'array',
});

/**
 * Probabilistic extra effect of a damaging Move.
 */
const SECONDARY: AttributeDefinition = AttributeDefinitionEntity.create({
	constraints: {
		fields: [
			AttributeDefinitionEntity.create({
				constraints: { max: 100, min: 0 },
				key: 'chance',
				required: false,
				type: 'number',
			}),
			AttributeDefinitionEntity.create({
				constraints: { minLength: 1 },
				key: 'status',
				required: false,
				type: 'string',
			}),
			AttributeDefinitionEntity.create({
				constraints: { minLength: 1 },
				key: 'volatileStatus',
				required: false,
				type: 'string',
			}),
			BOOSTS,
			AttributeDefinitionEntity.create({
				constraints: { fields: [BOOSTS] },
				key: 'self',
				required: false,
				type: 'record',
			}),
		],
	},
	key: 'secondary',
	required: false,
	type: 'record',
});

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
	 * Attributes that describe a neutral Move built from the dataset.
	 */
	static readonly MOVE: readonly AttributeDefinition[] = Object.freeze([
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
		AttributeDefinitionEntity.create({
			constraints: { minLength: 1 },
			key: 'status',
			required: false,
			type: 'string',
		}),
		AttributeDefinitionEntity.create({
			constraints: { minLength: 1 },
			key: 'volatileStatus',
			required: false,
			type: 'string',
		}),
		BOOSTS,
		SECONDARY,
		AttributeDefinitionEntity.create({
			constraints: { itemType: 'number', maxLength: 2, minLength: 2 },
			key: 'drain',
			required: false,
			type: 'array',
		}),
		AttributeDefinitionEntity.create({
			constraints: { itemType: 'number', maxLength: 2, minLength: 2 },
			key: 'recoil',
			required: false,
			type: 'array',
		}),
		AttributeDefinitionEntity.create({
			constraints: { itemType: 'number', maxLength: 2, minLength: 2 },
			key: 'multihit',
			required: false,
			type: 'array',
		}),
		AttributeDefinitionEntity.create({
			constraints: { min: 1 },
			key: 'critRatio',
			required: false,
			type: 'number',
		}),
	]);

	/**
	 * Attributes that describe a neutral Species built from the dataset.
	 */
	static readonly SPECIES: readonly AttributeDefinition[] = Object.freeze([
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

export { type DuelmonMoveCategory, type DuelmonType } from '@pocket-forge/duelmon-dataset';
