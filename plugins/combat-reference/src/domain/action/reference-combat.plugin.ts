import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type {
	Combat,
	CombatActionContext,
	CombatActionPlugin,
	CombatActionSet,
	CombatEvent,
	CombatMoveBinding,
	CombatPrimitives,
	CombatTransition,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { Combat as CombatEntity, CombatResolutionError } from '@pocket-forge/combat/domain';

import type { ReferenceOperation, ReferenceTargetScope } from './modify-attribute.config';
import { isReferenceOperation, isReferenceTargetScope, REFERENCE_CONFIG_KEYS } from './modify-attribute.config';
import ReferenceCombatActionCatalog from './reference-combat.catalog';
import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
} from './reference-combat.constants';
import type { ReferenceCombatInput, ReferenceCombatTarget } from './reference-combat.input';
import { parseReferenceCombatInput } from './reference-combat.input';

interface ModifyAttributeConfig {
	readonly amount: number;
	readonly attributeKey: string;
	readonly operation: ReferenceOperation;
	readonly probability: number | undefined;
	readonly scope: ReferenceTargetScope;
}

interface ResolvedTarget {
	readonly id: string | undefined;
	readonly scope: ReferenceTargetScope;
	readonly values: AttributeValues;
}

interface EventData {
	readonly after: AttributeValue;
	readonly before: AttributeValue | undefined;
	readonly config: ModifyAttributeConfig;
	readonly succeeded: boolean;
	readonly target: ResolvedTarget;
}

function findCombatant(combat: Combat, combatantId: string) {
	return combat.groups.flatMap(group => group.combatants).find(combatant => combatant.id === combatantId);
}

function readModifyAttributeConfig(binding: CombatMoveBinding): ModifyAttributeConfig | undefined {
	const config = binding.config.toPrimitives();
	const amount = config[REFERENCE_CONFIG_KEYS.amount];

	if (typeof amount !== 'number' || !Number.isFinite(amount)) {
		return undefined;
	}

	const attributeKey = config[REFERENCE_CONFIG_KEYS.attributeKey];

	if (typeof attributeKey !== 'string' || attributeKey.trim().length === 0) {
		return undefined;
	}

	const operation = config[REFERENCE_CONFIG_KEYS.operation];
	const scope = config[REFERENCE_CONFIG_KEYS.scope];

	if (!isReferenceOperation(operation) || !isReferenceTargetScope(scope)) {
		return undefined;
	}

	const probability = config[REFERENCE_CONFIG_KEYS.probability];

	if (probability !== undefined && (typeof probability !== 'number' || !Number.isFinite(probability))) {
		return undefined;
	}

	return { amount, attributeKey, operation, probability, scope };
}

function resolveReferenceTarget(
	combat: Combat,
	target: ReferenceCombatTarget,
	expectedScope: ReferenceTargetScope
): Either<CombatResolutionError[], ResolvedTarget> {
	if (target.scope !== expectedScope) {
		return Either.left([
			new CombatResolutionError(
				'invalid-target',
				`Action targets scope "${expectedScope}", received "${target.scope}"`,
				'input.target.scope'
			),
		]);
	}

	switch (target.scope) {
		case 'combat': {
			return Either.right({ id: undefined, scope: 'combat', values: combat.attributes.toPrimitives() });
		}
		case 'combatant': {
			if (!target.id) {
				return Either.left([
					new CombatResolutionError(
						'invalid-target',
						'Target scope "combatant" requires a combatant id',
						'input.target.id'
					),
				]);
			}

			const combatant = findCombatant(combat, target.id);

			if (!combatant) {
				return Either.left([
					new CombatResolutionError('invalid-target', `Unknown combatant "${target.id}"`, 'input.target.id'),
				]);
			}

			return Either.right({
				id: combatant.id,
				scope: 'combatant',
				values: combatant.attributes.toPrimitives(),
			});
		}
		case 'group': {
			if (!target.id) {
				return Either.left([
					new CombatResolutionError(
						'invalid-target',
						'Target scope "group" requires a group id',
						'input.target.id'
					),
				]);
			}

			const group = combat.groups.find(groupEntry => groupEntry.id === target.id);

			if (!group) {
				return Either.left([
					new CombatResolutionError(
						'invalid-target',
						`Unknown combatant group "${target.id}"`,
						'input.target.id'
					),
				]);
			}

			return Either.right({ id: group.id, scope: 'group', values: group.attributes.toPrimitives() });
		}
	}
}

function resolveNumericCurrent(raw: AttributeValue | undefined, definition: AttributeDefinition): number {
	if (typeof raw === 'number') {
		return raw;
	}

	if (typeof definition.defaultValue === 'number') {
		return definition.defaultValue;
	}

	return 0;
}

function saturate(value: number, definition: AttributeDefinition): number {
	const { max, min } = definition.constraints;
	let result = value;

	if (min !== undefined && result < min) {
		result = min;
	}

	if (max !== undefined && result > max) {
		result = max;
	}

	return result;
}

function updateAttributes(
	primitives: CombatPrimitives,
	target: ResolvedTarget,
	attributeKey: string,
	value: AttributeValue
): CombatPrimitives {
	switch (target.scope) {
		case 'combat': {
			return {
				...primitives,
				attributes: { ...primitives.attributes, [attributeKey]: value },
			};
		}
		case 'combatant': {
			return {
				...primitives,
				groups: primitives.groups.map(group => ({
					...group,
					combatants: group.combatants.map(combatant =>
						combatant.id === target.id
							? { ...combatant, attributes: { ...combatant.attributes, [attributeKey]: value } }
							: combatant
					),
				})),
			};
		}
		case 'group': {
			return {
				...primitives,
				groups: primitives.groups.map(group =>
					group.id === target.id
						? { ...group, attributes: { ...group.attributes, [attributeKey]: value } }
						: group
				),
			};
		}
	}
}

function buildEvent({ after, before, config, succeeded, target }: EventData): CombatEvent {
	const identity: AttributeValues = {
		actionId: MODIFY_ATTRIBUTE_ACTION_ID,
		attributeKey: config.attributeKey,
		scope: config.scope,
		...(target.id !== undefined && { targetId: target.id }),
	};

	if (!succeeded) {
		return {
			payload: { ...identity, probability: config.probability ?? 0 },
			sequence: 1,
			type: 'attribute-modification-failed',
		};
	}

	return {
		payload: {
			...identity,
			after,
			...(before !== undefined && { before }),
			operation: config.operation,
		},
		sequence: 1,
		type: 'attribute-modified',
	};
}

/**
 * Reference Combat plugin.
 *
 * It owns its action catalog, its input shape, and the `modifyAttribute`
 * resolution rules. Attribute Definitions are injected by the composition edge
 * so the plugin validates and saturates against the project attribute catalog.
 */
class ReferenceCombatPlugin implements CombatActionPlugin {
	/**
	 * Actions registered by this plugin.
	 */
	readonly actions: ReferenceCombatActionCatalog;
	/**
	 * Exact contract version declared by this plugin.
	 */
	readonly contractVersion = REFERENCE_PLUGIN_VERSION;
	/**
	 * Stable plugin identifier.
	 */
	readonly id = REFERENCE_PLUGIN_ID;
	private readonly attributeDefinitions: readonly AttributeDefinition[];
	private readonly versionValidator: ContractVersionValidator;

	constructor(versionValidator: ContractVersionValidator, attributeDefinitions: readonly AttributeDefinition[]) {
		this.versionValidator = versionValidator;
		this.attributeDefinitions = attributeDefinitions;
		this.actions = new ReferenceCombatActionCatalog();
	}

	/**
	 * Resolves a `modifyAttribute` action into a successor Combat.
	 *
	 * Validation happens before any randomness is consumed. The input Combat is
	 * never mutated: the successor is hydrated from changed primitives.
	 *
	 * @param context - Immutable action context.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		const parsedInput = parseReferenceCombatInput(context.input);

		if (parsedInput.isLeft()) {
			return Either.left(parsedInput.getLeft());
		}

		const input: ReferenceCombatInput = parsedInput.getRight();
		const binding = context.actionSet.find(input.moveId);

		if (!binding) {
			return Either.left([
				new CombatResolutionError(
					'invalid-action',
					`No combat action is bound to Move "${input.moveId}"`,
					'input.moveId'
				),
			]);
		}

		if (binding.actionId !== MODIFY_ATTRIBUTE_ACTION_ID) {
			return Either.left([
				new CombatResolutionError(
					'invalid-action',
					`Move "${input.moveId}" is bound to unsupported action "${binding.actionId}"`,
					'actionSet.bindings'
				),
			]);
		}

		if (!findCombatant(context.combat, input.actorId)) {
			return Either.left([
				new CombatResolutionError(
					'invalid-input',
					`Unknown combatant actor "${input.actorId}"`,
					'input.actorId'
				),
			]);
		}

		const config = readModifyAttributeConfig(binding);

		if (!config) {
			return Either.left([
				new CombatResolutionError(
					'invalid-action',
					`Action "${binding.actionId}" has an invalid configuration`,
					'actionSet.bindings'
				),
			]);
		}

		const resolvedTarget = resolveReferenceTarget(context.combat, input.target, config.scope);

		if (resolvedTarget.isLeft()) {
			return Either.left(resolvedTarget.getLeft());
		}

		const target = resolvedTarget.getRight();
		const definition = this.attributeDefinitions.find(entry => entry.key === config.attributeKey);

		if (!definition) {
			return Either.left([
				new CombatResolutionError(
					'invalid-target',
					`Attribute "${config.attributeKey}" is not defined for scope "${config.scope}"`,
					`config.${REFERENCE_CONFIG_KEYS.attributeKey}`
				),
			]);
		}

		if ((config.operation === 'add' || config.operation === 'subtract') && definition.type !== 'number') {
			return Either.left([
				new CombatResolutionError(
					'invalid-target',
					`Attribute "${config.attributeKey}" must be numeric for the "${config.operation}" operation`,
					`config.${REFERENCE_CONFIG_KEYS.operation}`
				),
			]);
		}

		const rawCurrent = target.values[config.attributeKey];
		const currentNumeric = resolveNumericCurrent(rawCurrent, definition);
		const nextValue: AttributeValue =
			config.operation === 'set'
				? config.amount
				: saturate(
						config.operation === 'add' ? currentNumeric + config.amount : currentNumeric - config.amount,
						definition
					);
		const validationError = definition.validateValue(nextValue);

		if (validationError) {
			return Either.left([
				new CombatResolutionError(
					'rejected',
					`Invalid value for attribute "${config.attributeKey}": ${validationError.message}`,
					`config.${REFERENCE_CONFIG_KEYS.amount}`
				),
			]);
		}

		let randomPocket = context.combat.randomPocket;
		let isSucceeded = true;

		if (config.probability !== undefined) {
			const [result, nextRandomPocket] = randomPocket.chance(config.probability);
			isSucceeded = result;
			randomPocket = nextRandomPocket;
		}

		const primitives = context.combat.toPrimitives();
		const updatedPrimitives = isSucceeded
			? updateAttributes(primitives, target, config.attributeKey, nextValue)
			: primitives;
		const combat = CombatEntity.fromPrimitives({
			...updatedPrimitives,
			randomPocket: randomPocket.toPrimitives(),
		});
		const before = config.operation === 'set' ? rawCurrent : currentNumeric;

		return Either.right({
			combat,
			events: [buildEvent({ after: nextValue, before, config, succeeded: isSucceeded, target })],
		});
	}

	/**
	 * Checks whether an action set targets this plugin and accepts its version.
	 *
	 * @param actionSet - Authored action set to check.
	 * @returns `true` when the plugin id matches and the set's semver range
	 *          accepts the plugin's exact version.
	 */
	supports(actionSet: CombatActionSet): boolean {
		return (
			actionSet.plugin.id === this.id &&
			this.versionValidator.isValid(this.contractVersion) &&
			this.versionValidator.isValidRange(actionSet.plugin.contractVersion) &&
			this.versionValidator.satisfies(this.contractVersion, actionSet.plugin.contractVersion)
		);
	}
}

export default ReferenceCombatPlugin;
