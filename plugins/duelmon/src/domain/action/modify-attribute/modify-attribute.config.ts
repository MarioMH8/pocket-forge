import Either from '@hexadrop/either';
import type { AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type { CombatMoveBinding, CombatResolutionError } from '@pocket-forge/combat/domain';

import { DuelmonErrors } from '../duelmon.errors';
import type { DuelmonTargetScope } from '../duelmon-target';
import { DuelmonTarget } from '../duelmon-target';

/**
 * Configuration keys authored on a `modifyAttribute` binding.
 */
const CONFIG_KEYS = {
	amount: 'duelmon.amount',
	attributeKey: 'duelmon.attributeKey',
	operation: 'duelmon.operation',
	probability: 'duelmon.probability',
	scope: 'duelmon.scope',
} as const;

/**
 * Operations supported by the Duelmon attribute action.
 */
const OPERATIONS = ['add', 'set', 'subtract'] as const;

type DuelmonOperation = (typeof OPERATIONS)[number];

const SCOPE_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...DuelmonTarget.SCOPES] },
	defaultValue: 'combat',
	key: CONFIG_KEYS.scope,
	required: true,
	type: 'enum',
});

const ATTRIBUTE_KEY_DEFINITION = AttributeDefinition.create({
	constraints: { minLength: 1 },
	key: CONFIG_KEYS.attributeKey,
	required: true,
	type: 'string',
});

const OPERATION_DEFINITION = AttributeDefinition.create({
	constraints: { validValues: [...OPERATIONS] },
	defaultValue: 'set',
	key: CONFIG_KEYS.operation,
	required: true,
	type: 'enum',
});

const AMOUNT_DEFINITION = AttributeDefinition.create({
	constraints: {},
	key: CONFIG_KEYS.amount,
	type: 'number',
});

const PROBABILITY_DEFINITION = AttributeDefinition.create({
	constraints: { max: 1, min: 0 },
	key: CONFIG_KEYS.probability,
	type: 'number',
});

/**
 * Validated configuration of a `modifyAttribute` binding.
 *
 * The config owns the schema of the action and the cross-field checks that
 * the attribute definitions cannot express alone.
 */
class ModifyAttributeConfig {
	/**
	 * Definitions that govern binding configuration values.
	 */
	static readonly DEFINITIONS: readonly AttributeDefinition[] = Object.freeze([
		SCOPE_DEFINITION,
		ATTRIBUTE_KEY_DEFINITION,
		OPERATION_DEFINITION,
		AMOUNT_DEFINITION,
		PROBABILITY_DEFINITION,
	]);

	/**
	 * Configuration keys authored on a binding.
	 */
	static readonly KEYS = CONFIG_KEYS;
	/**
	 * Operations supported by the action.
	 */
	static readonly OPERATIONS: readonly DuelmonOperation[] = OPERATIONS;
	/**
	 * Scopes supported by the action.
	 */
	static readonly SCOPES: readonly DuelmonTargetScope[] = DuelmonTarget.SCOPES;

	/**
	 * Numeric operand: the value to set or the amount to add or subtract.
	 */
	readonly amount: number;
	/**
	 * Attribute key to modify on the resolved target.
	 */
	readonly attributeKey: string;
	/**
	 * Operation applied to the current value.
	 */
	readonly operation: DuelmonOperation;
	/**
	 * Optional chance, from 0 to 1, that the modification succeeds.
	 */
	readonly probability: number | undefined;
	/**
	 * Scope that the action target must resolve to.
	 */
	readonly scope: DuelmonTargetScope;

	private constructor(
		amount: number,
		attributeKey: string,
		operation: DuelmonOperation,
		probability: number | undefined,
		scope: DuelmonTargetScope
	) {
		this.amount = amount;
		this.attributeKey = attributeKey;
		this.operation = operation;
		this.probability = probability;
		this.scope = scope;
	}

	/**
	 * Reads and validates the configuration carried by a binding.
	 *
	 * @param binding - Validated Move binding.
	 * @returns The action configuration, or an invalid-action failure.
	 * @example
	 * ```ts
	 * const config = ModifyAttributeConfig.fromBinding(binding).getRight();
	 *
	 * config.scope; // 'combatant'
	 * config.operation; // 'add'
	 * ```
	 */
	static fromBinding(binding: CombatMoveBinding): Either<CombatResolutionError[], ModifyAttributeConfig> {
		const config = binding.config.toPrimitives();
		const amount = config[CONFIG_KEYS.amount];

		if (typeof amount !== 'number' || !Number.isFinite(amount)) {
			return this.invalid(binding);
		}

		const attributeKey = config[CONFIG_KEYS.attributeKey];

		if (typeof attributeKey !== 'string' || attributeKey.trim().length === 0) {
			return this.invalid(binding);
		}

		const operation = config[CONFIG_KEYS.operation];
		const scope = config[CONFIG_KEYS.scope];

		if (!this.isOperation(operation) || !DuelmonTarget.isScope(scope)) {
			return this.invalid(binding);
		}

		const probability = config[CONFIG_KEYS.probability];

		if (probability !== undefined && (typeof probability !== 'number' || !Number.isFinite(probability))) {
			return this.invalid(binding);
		}

		return Either.right(new ModifyAttributeConfig(amount, attributeKey, operation, probability, scope));
	}

	/**
	 * Narrows an unknown value to a supported operation.
	 *
	 * @param value - Candidate operation.
	 * @returns Whether the value is supported.
	 */
	static isOperation(value: unknown): value is DuelmonOperation {
		return typeof value === 'string' && (OPERATIONS as readonly string[]).includes(value);
	}

	/**
	 * Validates cross-field rules that definitions cannot express alone.
	 *
	 * @param config - Validated configuration values, including defaults.
	 * @returns Human-readable validation messages, or an empty list.
	 */
	static validate(config: AttributeValues): string[] {
		const messages: string[] = [];
		const amount = config[CONFIG_KEYS.amount];
		const probability = config[CONFIG_KEYS.probability];

		if (amount === undefined) {
			messages.push(`${CONFIG_KEYS.amount} is required`);
		} else if (typeof amount !== 'number' || !Number.isFinite(amount)) {
			messages.push(`${CONFIG_KEYS.amount} must be a finite number`);
		}

		if (probability !== undefined && (typeof probability !== 'number' || !Number.isFinite(probability))) {
			messages.push(`${CONFIG_KEYS.probability} must be a finite number`);
		}

		return messages;
	}

	private static invalid(binding: CombatMoveBinding): Either<CombatResolutionError[], never> {
		return DuelmonErrors.fail(
			'invalid-action',
			`Action "${binding.actionId}" has an invalid configuration`,
			'actionSet.bindings'
		);
	}
}

export type { DuelmonOperation };
export { ModifyAttributeConfig };

export default ModifyAttributeConfig;
