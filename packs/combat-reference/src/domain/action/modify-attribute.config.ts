import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

/**
 * Configuration keys authored on a `modifyAttribute` binding.
 */
const REFERENCE_CONFIG_KEYS = {
	amount: 'reference.amount',
	attributeKey: 'reference.attributeKey',
	operation: 'reference.operation',
	probability: 'reference.probability',
	scope: 'reference.scope',
} as const;

/**
 * Scopes supported by the reference attribute action.
 */
const REFERENCE_SCOPES = ['combat', 'combatant', 'group'] as const;

/**
 * Operations supported by the reference attribute action.
 */
const REFERENCE_OPERATIONS = ['add', 'set', 'subtract'] as const;

type ReferenceTargetScope = (typeof REFERENCE_SCOPES)[number];
type ReferenceOperation = (typeof REFERENCE_OPERATIONS)[number];

const REFERENCE_SCOPE_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...REFERENCE_SCOPES] },
	defaultValue: 'combat',
	key: REFERENCE_CONFIG_KEYS.scope,
	required: true,
	type: 'enum',
});

const REFERENCE_ATTRIBUTE_KEY_DEFINITION = AttributeDefinition.create({
	constraints: { minLength: 1 },
	key: REFERENCE_CONFIG_KEYS.attributeKey,
	required: true,
	type: 'string',
});

const REFERENCE_OPERATION_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...REFERENCE_OPERATIONS] },
	defaultValue: 'set',
	key: REFERENCE_CONFIG_KEYS.operation,
	required: true,
	type: 'enum',
});

const REFERENCE_AMOUNT_DEFINITION = AttributeDefinition.create({
	constraints: {},
	key: REFERENCE_CONFIG_KEYS.amount,
	type: 'number',
});

const REFERENCE_PROBABILITY_DEFINITION = AttributeDefinition.create({
	constraints: { max: 1, min: 0 },
	key: REFERENCE_CONFIG_KEYS.probability,
	type: 'number',
});

/**
 * Definitions that govern `modifyAttribute` configuration values.
 */
const MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS: readonly AttributeDefinition[] = [
	REFERENCE_SCOPE_DEFINITION,
	REFERENCE_ATTRIBUTE_KEY_DEFINITION,
	REFERENCE_OPERATION_DEFINITION,
	REFERENCE_AMOUNT_DEFINITION,
	REFERENCE_PROBABILITY_DEFINITION,
];

function isReferenceTargetScope(value: unknown): value is ReferenceTargetScope {
	return typeof value === 'string' && (REFERENCE_SCOPES as readonly string[]).includes(value);
}

function isReferenceOperation(value: unknown): value is ReferenceOperation {
	return typeof value === 'string' && (REFERENCE_OPERATIONS as readonly string[]).includes(value);
}

/**
 * Validates cross-field rules that definitions cannot express alone.
 *
 * @param config - Validated configuration values, including defaults.
 * @returns Human-readable validation messages, or an empty list.
 */
function validateModifyAttributeConfig(config: AttributeValues): string[] {
	const messages: string[] = [];
	const amount = config[REFERENCE_CONFIG_KEYS.amount];
	const probability = config[REFERENCE_CONFIG_KEYS.probability];

	if (amount === undefined) {
		messages.push(`${REFERENCE_CONFIG_KEYS.amount} is required`);
	} else if (typeof amount !== 'number' || !Number.isFinite(amount)) {
		messages.push(`${REFERENCE_CONFIG_KEYS.amount} must be a finite number`);
	}

	if (probability !== undefined && (typeof probability !== 'number' || !Number.isFinite(probability))) {
		messages.push(`${REFERENCE_CONFIG_KEYS.probability} must be a finite number`);
	}

	return messages;
}

export type { ReferenceOperation, ReferenceTargetScope };
export {
	isReferenceOperation,
	isReferenceTargetScope,
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	REFERENCE_CONFIG_KEYS,
	REFERENCE_OPERATIONS,
	REFERENCE_SCOPES,
	validateModifyAttributeConfig,
};
