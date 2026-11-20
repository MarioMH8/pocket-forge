import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValue } from '@pocket-forge/attribute/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type {
	CombatActionContext,
	CombatActionDescriptor,
	CombatMoveBinding,
	CombatResolutionError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';

import { DuelmonCombatEvents } from '../../event/duelmon-combat-events';
import { DuelmonCombatAttributes } from '../combat-attributes';
import { DuelmonErrors } from '../duelmon.errors';
import type DuelmonAction from '../duelmon-action';
import type { DuelmonCombatInput } from '../duelmon-combat.input';
import { DuelmonTarget } from '../duelmon-target';
import { ModifyAttributeConfig } from './modify-attribute.config';

/**
 * Resolves the `modifyAttribute` action.
 *
 * The action validates and saturates values against the project attribute
 * definitions, applies an optional probability draw, and emits the matching
 * success or failure event.
 */
class ModifyAttributeAction implements DuelmonAction {
	/**
	 * Stable identifier of the attribute-modification action.
	 */
	static readonly ID = 'modifyAttribute';

	readonly descriptor: CombatActionDescriptor;
	readonly id: string;
	private readonly attributeDefinitions: readonly AttributeDefinition[];

	constructor(attributeDefinitions: readonly AttributeDefinition[]) {
		this.attributeDefinitions = attributeDefinitions;
		this.id = ModifyAttributeAction.ID;
		this.descriptor = {
			configDefinitions: ModifyAttributeConfig.DEFINITIONS,
			id: this.id,
			validateConfig: config => ModifyAttributeConfig.validate(config),
		};
	}

	/**
	 * Resolves a bound attribute modification into a successor Combat.
	 *
	 * @param context - Immutable action context.
	 * @param input - Parsed Duelmon input.
	 * @param binding - Move binding that selected this action.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(
		context: CombatActionContext,
		input: DuelmonCombatInput,
		binding: CombatMoveBinding
	): Either<CombatResolutionError[], CombatTransition> {
		if (!DuelmonTarget.findCombatant(context.combat, input.actorId)) {
			return DuelmonErrors.fail('invalid-input', `Unknown combatant actor "${input.actorId}"`, 'input.actorId');
		}

		const parsedConfig = ModifyAttributeConfig.fromBinding(binding);

		if (parsedConfig.isLeft()) {
			return Either.left(parsedConfig.getLeft());
		}

		const config = parsedConfig.getRight();
		const resolvedTarget = input.target.resolve(context.combat, config.scope);

		if (resolvedTarget.isLeft()) {
			return Either.left(resolvedTarget.getLeft());
		}

		const target = resolvedTarget.getRight();
		const definition = this.attributeDefinitions.find(entry => entry.key === config.attributeKey);

		if (!definition) {
			return DuelmonErrors.fail(
				'invalid-target',
				`Attribute "${config.attributeKey}" is not defined for scope "${config.scope}"`,
				`config.${ModifyAttributeConfig.KEYS.attributeKey}`
			);
		}

		if ((config.operation === 'add' || config.operation === 'subtract') && definition.type !== 'number') {
			return DuelmonErrors.fail(
				'invalid-target',
				`Attribute "${config.attributeKey}" must be numeric for the "${config.operation}" operation`,
				`config.${ModifyAttributeConfig.KEYS.operation}`
			);
		}

		const rawCurrent = target.values[config.attributeKey];
		const currentNumeric = DuelmonCombatAttributes.resolveNumeric(rawCurrent, definition);
		const nextValue: AttributeValue =
			config.operation === 'set'
				? config.amount
				: DuelmonCombatAttributes.saturate(
						config.operation === 'add' ? currentNumeric + config.amount : currentNumeric - config.amount,
						definition
					);
		const validationError = definition.validateValue(nextValue);

		if (validationError) {
			return DuelmonErrors.fail(
				'rejected',
				`Invalid value for attribute "${config.attributeKey}": ${validationError.message}`,
				`config.${ModifyAttributeConfig.KEYS.amount}`
			);
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
			? DuelmonCombatAttributes.update(primitives, target, config.attributeKey, nextValue)
			: primitives;
		const combat = CombatEntity.fromPrimitives({
			...updatedPrimitives,
			randomPocket: randomPocket.toPrimitives(),
		});
		const before = config.operation === 'set' ? rawCurrent : currentNumeric;
		const identity = {
			actionId: this.id,
			attributeKey: config.attributeKey,
			scope: config.scope,
			...(target.id !== undefined && { targetId: target.id }),
		};
		const event = isSucceeded
			? DuelmonCombatEvents.attributeModified(
					{
						...identity,
						after: nextValue,
						...(before !== undefined && { before }),
						operation: config.operation,
					},
					1
				)
			: DuelmonCombatEvents.attributeModificationFailed(
					{
						...identity,
						probability: config.probability ?? 0,
					},
					1
				);

		return Either.right({
			combat,
			events: [event],
		});
	}
}

export { ModifyAttributeAction };

export default ModifyAttributeAction;
