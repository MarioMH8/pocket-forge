import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import type { CombatActionCatalog } from './combat-action';
import CombatMoveBindingSetError from './combat-move-binding-set.error';

/**
 * Plain, serializable representation of a Move binding.
 */
interface CombatMoveBindingPrimitives {
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
 * Plain, serializable representation of a Combat Move Binding Set.
 */
interface CombatMoveBindingSetPrimitives {
	/**
	 * Bindings between Moves and registered combat actions.
	 */
	readonly bindings: readonly CombatMoveBindingPrimitives[];
}

/**
 * A validated binding between a Move and a registered combat action.
 */
class CombatMoveBinding {
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
	static create(moveId: string, actionId: string, config: AttributeMap): CombatMoveBinding {
		return new CombatMoveBinding(actionId, config, moveId);
	}

	/**
	 * Hydrates a binding without validating its configuration.
	 *
	 * @param primitives - Serialized binding data.
	 * @returns A rehydrated binding value.
	 */
	static fromPrimitives(primitives: CombatMoveBindingPrimitives): CombatMoveBinding {
		return new CombatMoveBinding(
			primitives.actionId,
			AttributeMap.fromPrimitives(primitives.config),
			primitives.moveId
		);
	}

	/**
	 * Serializes this binding into its primitive representation.
	 *
	 * @returns A plain {@link CombatMoveBindingPrimitives} snapshot.
	 */
	toPrimitives(): CombatMoveBindingPrimitives {
		return {
			actionId: this.actionId,
			config: this.config.toPrimitives(),
			moveId: this.moveId,
		};
	}
}

/**
 * Authored set of Move-to-action bindings handled by a Combat Action Resolver.
 *
 * The set is a pure data contract: it validates that every Move binding points
 * to a registered action and carries a valid configuration. It never imports
 * Move or plugin packages, and the app pairs it with a resolver.
 */
class CombatMoveBindingSet {
	/**
	 * Validated Move bindings.
	 */
	readonly bindings: readonly CombatMoveBinding[];

	private constructor(bindings: readonly CombatMoveBinding[]) {
		this.bindings = bindings;
	}

	/**
	 * Validates primitives and builds an immutable binding set.
	 *
	 * Validation failures are aggregated: duplicate Move ids, unknown actions,
	 * invalid configuration, and empty identifiers are reported together.
	 *
	 * @param primitives - Serialized binding set data.
	 * @param catalog - Action catalog owned by the resolver.
	 * @returns A validated binding set, or every validation failure.
	 */
	static create(
		primitives: CombatMoveBindingSetPrimitives,
		catalog: CombatActionCatalog
	): Either<CombatMoveBindingSetError[], CombatMoveBindingSet> {
		const errors: CombatMoveBindingSetError[] = [];

		const bindings: CombatMoveBinding[] = [];
		const seenMoveIds = new Set<string>();

		for (const [index, binding] of primitives.bindings.entries()) {
			const prefix = `bindings.${String(index)}`;
			const bindingErrors: CombatMoveBindingSetError[] = [];

			if (!this.isNonEmpty(binding.moveId)) {
				bindingErrors.push(
					new CombatMoveBindingSetError(
						'invalid-move-id',
						'Combat move binding set binding moveId is required',
						`${prefix}.moveId`
					)
				);
			} else if (seenMoveIds.has(binding.moveId)) {
				bindingErrors.push(
					new CombatMoveBindingSetError(
						'duplicate-move-binding',
						`Duplicated Move id: ${binding.moveId}`,
						`${prefix}.moveId`
					)
				);
			} else {
				seenMoveIds.add(binding.moveId);
			}

			if (!this.isNonEmpty(binding.actionId)) {
				bindingErrors.push(
					new CombatMoveBindingSetError(
						'invalid-action-id',
						'Combat move binding set binding actionId is required',
						`${prefix}.actionId`
					)
				);
				errors.push(...bindingErrors);
				continue;
			}

			const descriptor = catalog.find(binding.actionId);

			if (!descriptor) {
				bindingErrors.push(
					new CombatMoveBindingSetError(
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
			const messages = descriptor.validate(config.toPrimitives());

			if (messages.length > 0) {
				errors.push(
					...messages.map(
						message => new CombatMoveBindingSetError('invalid-config', message, `${prefix}.config`)
					)
				);
				continue;
			}

			bindings.push(CombatMoveBinding.create(binding.moveId, binding.actionId, config));
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(new CombatMoveBindingSet(Object.freeze(bindings)));
	}

	/**
	 * Hydrates a binding set without validating it.
	 *
	 * @param primitives - Serialized binding set data.
	 * @returns A rehydrated binding set.
	 */
	static fromPrimitives(primitives: CombatMoveBindingSetPrimitives): CombatMoveBindingSet {
		const bindings = primitives.bindings.map(binding => CombatMoveBinding.fromPrimitives(binding));

		return new CombatMoveBindingSet(Object.freeze(bindings));
	}

	private static isNonEmpty(value: string): boolean {
		return typeof value === 'string' && value.trim().length > 0;
	}

	private static validateConfig(
		config: AttributeValues,
		definitions: readonly AttributeDefinition[],
		path: string
	): CombatMoveBindingSetError[] {
		const errors: CombatMoveBindingSetError[] = [];
		const definitionMap = new Map(definitions.map(definition => [definition.key, definition]));

		for (const key of Object.keys(config)) {
			if (!definitionMap.has(key)) {
				errors.push(
					new CombatMoveBindingSetError(
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
					new CombatMoveBindingSetError(
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
					new CombatMoveBindingSetError(
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
	find(moveId: string): CombatMoveBinding | undefined {
		return this.bindings.find(binding => binding.moveId === moveId);
	}

	/**
	 * Serializes this binding set into its primitive representation.
	 *
	 * @returns A plain {@link CombatMoveBindingSetPrimitives} snapshot.
	 */
	toPrimitives(): CombatMoveBindingSetPrimitives {
		return {
			bindings: this.bindings.map(binding => binding.toPrimitives()),
		};
	}
}

export type { CombatMoveBindingPrimitives, CombatMoveBindingSetPrimitives };
export { CombatMoveBinding };
export default CombatMoveBindingSet;
