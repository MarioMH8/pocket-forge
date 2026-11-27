import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import CombatActionBindingSetError from './combat-action-binding-set.error';
import type { CombatActionCatalog } from './combat-action-descriptor';

/**
 * Plain, serializable representation of an action binding.
 */
interface CombatActionBindingPrimitives {
	/**
	 * Registered combat action identifier.
	 */
	readonly actionId: string;
	/**
	 * Action configuration.
	 */
	readonly config: AttributeValues;
	/**
	 * Move identifier authored in a Combat Rule.
	 */
	readonly moveId: string;
}

/**
 * Plain, serializable representation of a Combat Action Binding Set.
 */
interface CombatActionBindingSetPrimitives {
	/**
	 * Bindings between Moves and registered combat actions.
	 */
	readonly bindings: readonly CombatActionBindingPrimitives[];
}

/**
 * A validated binding between a Move identifier and a registered combat action.
 */
class CombatActionBinding {
	/**
	 * Registered combat action identifier.
	 */
	readonly actionId: string;
	/**
	 * Validated action configuration.
	 */
	readonly config: AttributeMap;
	/**
	 * Move identifier authored in a Combat Rule.
	 */
	readonly moveId: string;

	private constructor(actionId: string, config: AttributeMap, moveId: string) {
		this.actionId = actionId;
		this.config = config;
		this.moveId = moveId;
	}

	/**
	 * Wraps an already validated configuration into a binding.
	 *
	 * @param moveId - Move identifier.
	 * @param actionId - Registered combat action identifier.
	 * @param config - Validated action configuration.
	 * @returns An immutable binding value.
	 */
	static create(moveId: string, actionId: string, config: AttributeMap): CombatActionBinding {
		return new CombatActionBinding(actionId, config, moveId);
	}

	/**
	 * Hydrates a binding without validating its configuration.
	 *
	 * @param primitives - Serialized binding data.
	 * @returns A rehydrated binding value.
	 */
	static fromPrimitives(primitives: CombatActionBindingPrimitives): CombatActionBinding {
		return new CombatActionBinding(
			primitives.actionId,
			AttributeMap.fromPrimitives(primitives.config),
			primitives.moveId
		);
	}

	/**
	 * Serializes this binding into its primitive representation.
	 *
	 * @returns A plain {@link CombatActionBindingPrimitives} snapshot.
	 */
	toPrimitives(): CombatActionBindingPrimitives {
		return {
			actionId: this.actionId,
			config: this.config.toPrimitives(),
			moveId: this.moveId,
		};
	}
}

/**
 * Authored set of action bindings handled by a Combat Action Resolver.
 *
 * The set is a pure data contract: it validates that every action binding points
 * to a registered action and carries a valid configuration. It never imports
 * Move or plugin packages, and the app pairs it with a resolver.
 */
class CombatActionBindingSet {
	/**
	 * Validated action bindings.
	 */
	readonly bindings: readonly CombatActionBinding[];

	private constructor(bindings: readonly CombatActionBinding[]) {
		this.bindings = bindings;
	}

	/**
	 * Validates primitives and builds an immutable binding set.
	 *
	 * Validation failures are aggregated: duplicate Move identifiers, unknown actions,
	 * invalid configuration, and empty identifiers are reported together.
	 *
	 * @param primitives - Serialized binding set data.
	 * @param catalog - Action catalog owned by the resolver.
	 * @returns A validated binding set, or every validation failure.
	 */
	static create(
		primitives: CombatActionBindingSetPrimitives,
		catalog: CombatActionCatalog
	): Either<CombatActionBindingSetError[], CombatActionBindingSet> {
		const errors: CombatActionBindingSetError[] = [];

		const bindings: CombatActionBinding[] = [];
		const seenMoveIds = new Set<string>();

		for (const [index, binding] of primitives.bindings.entries()) {
			const prefix = `bindings.${String(index)}`;
			const bindingErrors: CombatActionBindingSetError[] = [];

			if (!this.isNonEmpty(binding.moveId)) {
				bindingErrors.push(
					new CombatActionBindingSetError(
						'invalid-move-id',
						'Combat action binding set binding moveId is required',
						`${prefix}.moveId`
					)
				);
			} else if (seenMoveIds.has(binding.moveId)) {
				bindingErrors.push(
					new CombatActionBindingSetError(
						'duplicate-action-binding',
						`Duplicated Move id: ${binding.moveId}`,
						`${prefix}.moveId`
					)
				);
			} else {
				seenMoveIds.add(binding.moveId);
			}

			if (!this.isNonEmpty(binding.actionId)) {
				bindingErrors.push(
					new CombatActionBindingSetError(
						'invalid-action-id',
						'Combat action binding set binding actionId is required',
						`${prefix}.actionId`
					)
				);
				errors.push(...bindingErrors);
				continue;
			}

			const descriptor = catalog.find(binding.actionId);

			if (!descriptor) {
				bindingErrors.push(
					new CombatActionBindingSetError(
						'unknown-action',
						`Unknown combat action "${binding.actionId}"`,
						`${prefix}.actionId`
					)
				);
				errors.push(...bindingErrors);
				continue;
			}

			bindingErrors.push(
				...this.validateConfig(binding.config, descriptor.configDefinitions, `${prefix}.config`)
			);

			if (bindingErrors.length > 0) {
				errors.push(...bindingErrors);
				continue;
			}

			const config = AttributeMap.create(binding.config, [...descriptor.configDefinitions], 'CombatAction');
			const messages = descriptor.validateConfig?.(config.toPrimitives());

			if (messages && messages.length > 0) {
				errors.push(
					...messages.map(
						message => new CombatActionBindingSetError('invalid-config', message, `${prefix}.config`)
					)
				);
				continue;
			}

			bindings.push(CombatActionBinding.create(binding.moveId, binding.actionId, config));
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(new CombatActionBindingSet(Object.freeze(bindings)));
	}

	/**
	 * Hydrates a binding set without validating it.
	 *
	 * @param primitives - Serialized binding set data.
	 * @returns A rehydrated binding set.
	 */
	static fromPrimitives(primitives: CombatActionBindingSetPrimitives): CombatActionBindingSet {
		const bindings = primitives.bindings.map(binding => CombatActionBinding.fromPrimitives(binding));

		return new CombatActionBindingSet(Object.freeze(bindings));
	}

	private static isNonEmpty(value: string): boolean {
		return typeof value === 'string' && value.trim().length > 0;
	}

	private static validateConfig(
		config: AttributeValues,
		definitions: readonly AttributeDefinition[],
		path: string
	): CombatActionBindingSetError[] {
		const errors: CombatActionBindingSetError[] = [];
		const definitionMap = new Map(definitions.map(definition => [definition.key, definition]));

		for (const key of Object.keys(config)) {
			if (!definitionMap.has(key)) {
				errors.push(
					new CombatActionBindingSetError(
						'invalid-config',
						`No definition found for action config "${key}"`,
						`${path}.${key}`
					)
				);
			}
		}

		for (const definition of definitions) {
			const raw = config[definition.key];

			if (raw === undefined && !definition.required) {
				continue;
			}

			const value = raw ?? definition.defaultValue;

			if (value === undefined) {
				errors.push(
					new CombatActionBindingSetError(
						'invalid-config',
						`Attribute "${definition.key}" is required but no value or default was provided`,
						`${path}.${definition.key}`
					)
				);
				continue;
			}

			const error = definition.validateValue(value);

			if (error) {
				errors.push(
					new CombatActionBindingSetError(
						'invalid-config',
						`Invalid value for attribute "${definition.key}": ${error.message}`,
						`${path}.${definition.key}`
					)
				);
			}
		}

		return errors;
	}

	/**
	 * Finds the binding registered for a Move.
	 *
	 * @param moveId - Move identifier.
	 * @returns The binding, or `undefined` when the Move is not bound.
	 */
	find(moveId: string): CombatActionBinding | undefined {
		return this.bindings.find(binding => binding.moveId === moveId);
	}

	/**
	 * Serializes this binding set into its primitive representation.
	 *
	 * @returns A plain {@link CombatActionBindingSetPrimitives} snapshot.
	 */
	toPrimitives(): CombatActionBindingSetPrimitives {
		return {
			bindings: this.bindings.map(binding => binding.toPrimitives()),
		};
	}
}

export type { CombatActionBindingPrimitives, CombatActionBindingSetPrimitives };
export { CombatActionBinding };
export default CombatActionBindingSet;
