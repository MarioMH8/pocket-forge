import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

/**
 * Configuration keys authored on a `modifyAttribute` binding.
 */
const DUELMON_CONFIG_KEYS = {
	amount: 'duelmon.amount',
	attributeKey: 'duelmon.attributeKey',
	operation: 'duelmon.operation',
	probability: 'duelmon.probability',
	scope: 'duelmon.scope',
} as const;

/**
 * Scopes supported by the duelmon attribute action.
 */
const DUELMON_SCOPES = ['combat', 'combatant', 'group'] as const;

/**
 * Operations supported by the duelmon attribute action.
 */
const DUELMON_OPERATIONS = ['add', 'set', 'subtract'] as const;

type DuelmonTargetScope = (typeof DUELMON_SCOPES)[number];
type DuelmonOperation = (typeof DUELMON_OPERATIONS)[number];

const DUELMON_SCOPE_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...DUELMON_SCOPES] },
	defaultValue: 'combat',
	key: DUELMON_CONFIG_KEYS.scope,
	required: true,
	type: 'enum',
});

const DUELMON_ATTRIBUTE_KEY_DEFINITION = AttributeDefinition.create({
	constraints: { minLength: 1 },
	key: DUELMON_CONFIG_KEYS.attributeKey,
	required: true,
	type: 'string',
});

const DUELMON_OPERATION_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...DUELMON_OPERATIONS] },
	defaultValue: 'set',
	key: DUELMON_CONFIG_KEYS.operation,
	required: true,
	type: 'enum',
});

const DUELMON_AMOUNT_DEFINITION = AttributeDefinition.create({
	constraints: {},
	key: DUELMON_CONFIG_KEYS.amount,
	type: 'number',
});

const DUELMON_PROBABILITY_DEFINITION = AttributeDefinition.create({
	constraints: { max: 1, min: 0 },
	key: DUELMON_CONFIG_KEYS.probability,
	type: 'number',
});

/**
 * Definitions that govern `modifyAttribute` configuration values.
 */
const MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS: readonly AttributeDefinition[] = [
	DUELMON_SCOPE_DEFINITION,
	DUELMON_ATTRIBUTE_KEY_DEFINITION,
	DUELMON_OPERATION_DEFINITION,
	DUELMON_AMOUNT_DEFINITION,
	DUELMON_PROBABILITY_DEFINITION,
];

function isDuelmonTargetScope(value: unknown): value is DuelmonTargetScope {
	return typeof value === 'string' && (DUELMON_SCOPES as readonly string[]).includes(value);
}

function isDuelmonOperation(value: unknown): value is DuelmonOperation {
	return typeof value === 'string' && (DUELMON_OPERATIONS as readonly string[]).includes(value);
}

/**
 * Validates cross-field rules that definitions cannot express alone.
 *
 * @param config - Validated configuration values, including defaults.
 * @returns Human-readable validation messages, or an empty list.
 */
function validateModifyAttributeConfig(config: AttributeValues): string[] {
	const messages: string[] = [];
	const amount = config[DUELMON_CONFIG_KEYS.amount];
	const probability = config[DUELMON_CONFIG_KEYS.probability];

	if (amount === undefined) {
		messages.push(`${DUELMON_CONFIG_KEYS.amount} is required`);
	} else if (typeof amount !== 'number' || !Number.isFinite(amount)) {
		messages.push(`${DUELMON_CONFIG_KEYS.amount} must be a finite number`);
	}

	if (probability !== undefined && (typeof probability !== 'number' || !Number.isFinite(probability))) {
		messages.push(`${DUELMON_CONFIG_KEYS.probability} must be a finite number`);
	}

	return messages;
}

export type { DuelmonOperation, DuelmonTargetScope };
export {
	DUELMON_CONFIG_KEYS,
	DUELMON_OPERATIONS,
	DUELMON_SCOPES,
	isDuelmonOperation,
	isDuelmonTargetScope,
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	validateModifyAttributeConfig,
};
