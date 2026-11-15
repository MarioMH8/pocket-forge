import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import { AttributeMap } from '@pocket-forge/attribute/domain';

import type ContractVersionValidator from '../ruleset/contract-version.validator';
import type { CombatActionCatalog } from './combat-action';
import CombatActionSetError from './combat-action-set.error';

/**
 * Plugin reference declared by a Combat Action Set.
 *
 * `contractVersion` is a version **range** the action set accepts; the
 * compatible exact version is declared by the plugin itself.
 */
interface CombatActionSetPlugin {
	/**
	 * Semver range the action set accepts from the plugin.
	 */
	readonly contractVersion: string;
	/**
	 * Stable plugin identifier.
	 */
	readonly id: string;
}

/**
 * Plain, serializable representation of a Move binding.
 */
interface CombatMoveBindingPrimitives {
	/**
	 * Registered combat action identifier.
	 */
	readonly actionId: string;
	/**
	 * Action configuration values.
	 */
	readonly config: AttributeValues;
	/**
	 * Move identifier authored in a Combat Ruleset.
	 */
	readonly moveId: string;
}

/**
 * Plain, serializable representation of a Combat Action Set.
 */
interface CombatActionSetPrimitives {
	/**
	 * Bindings between Moves and registered combat actions.
	 */
	readonly bindings: readonly CombatMoveBindingPrimitives[];
	/**
	 * Plugin reference accepted by this action set.
	 */
	readonly plugin: CombatActionSetPlugin;
}

/**
 * A validated binding between a Move and a plugin-registered combat action.
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
	 * Move identifier authored in a Combat Ruleset.
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
	 * @param actionId - Registered action identifier.
	 * @param config - Validated action configuration.
	 * @returns An immutable binding value.
	 */
	static create(moveId: string, actionId: string, config: AttributeMap): CombatMoveBinding {
		return new CombatMoveBinding(actionId, config, moveId);
	}

	/**
	 * Hydrates a binding without re-validating its configuration.
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
 * Authored set of Move-to-action bindings handled by a Combat Action Plugin.
 *
 * The action set is a pure data contract: it declares which plugin it targets
 * and validates that every Move binding references a known action with a valid
 * configuration. It never imports Move or plugin packages.
 */
class CombatActionSet {
	/**
	 * Validated Move bindings.
	 */
	readonly bindings: readonly CombatMoveBinding[];
	/**
	 * Plugin reference accepted by this action set.
	 */
	readonly plugin: CombatActionSetPlugin;

	private constructor(bindings: readonly CombatMoveBinding[], plugin: CombatActionSetPlugin) {
		this.bindings = bindings;
		this.plugin = plugin;
	}

	/**
	 * Validates primitives and builds an immutable action set.
	 *
	 * Validation failures are aggregated instead of thrown: empty plugin and
	 * binding ids, an invalid version range, duplicated Move ids, unknown
	 * actions, and invalid action configurations.
	 *
	 * @param primitives - Serialized action set data.
	 * @param catalog - Plugin-owned action catalog.
	 * @param versionValidator - Domain port that validates version ranges.
	 * @returns A validated action set, or every validation failure.
	 */
	static create(
		primitives: CombatActionSetPrimitives,
		catalog: CombatActionCatalog,
		versionValidator: ContractVersionValidator
	): Either<CombatActionSetError[], CombatActionSet> {
		const errors: CombatActionSetError[] = [];

		this.validatePlugin(primitives.plugin, versionValidator, errors);

		const bindings: CombatMoveBinding[] = [];
		const seenMoveIds = new Set<string>();

		for (const [index, binding] of primitives.bindings.entries()) {
			const prefix = `bindings.${String(index)}`;
			const bindingErrors: CombatActionSetError[] = [];

			if (!this.isNonEmpty(binding.moveId)) {
				bindingErrors.push(
					new CombatActionSetError(
						'invalid-move-id',
						'Combat action set binding moveId is required',
						`${prefix}.moveId`
					)
				);
			} else if (seenMoveIds.has(binding.moveId)) {
				bindingErrors.push(
					new CombatActionSetError(
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
					new CombatActionSetError(
						'invalid-action-id',
						'Combat action set binding actionId is required',
						`${prefix}.actionId`
					)
				);
				errors.push(...bindingErrors);
				continue;
			}

			const descriptor = catalog.find(binding.actionId);

			if (!descriptor) {
				bindingErrors.push(
					new CombatActionSetError(
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
			const messages = descriptor.validateConfig?.(config.toPrimitives()) ?? [];

			if (messages.length > 0) {
				errors.push(
					...messages.map(message => new CombatActionSetError('invalid-config', message, `${prefix}.config`))
				);
				continue;
			}

			bindings.push(CombatMoveBinding.create(binding.moveId, binding.actionId, config));
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(new CombatActionSet(Object.freeze(bindings), Object.freeze({ ...primitives.plugin })));
	}

	/**
	 * Hydrates an action set without re-validating it.
	 *
	 * @param primitives - Serialized action set data.
	 * @returns A rehydrated action set.
	 */
	static fromPrimitives(primitives: CombatActionSetPrimitives): CombatActionSet {
		const bindings = primitives.bindings.map(binding => CombatMoveBinding.fromPrimitives(binding));

		return new CombatActionSet(Object.freeze(bindings), Object.freeze({ ...primitives.plugin }));
	}

	private static isNonEmpty(value: string): boolean {
		return typeof value === 'string' && value.trim().length > 0;
	}

	private static validateConfig(
		config: AttributeValues,
		definitions: readonly AttributeDefinition[],
		path: string
	): CombatActionSetError[] {
		const errors: CombatActionSetError[] = [];
		const definitionMap = new Map(definitions.map(definition => [definition.key, definition]));

		for (const key of Object.keys(config)) {
			if (!definitionMap.has(key)) {
				errors.push(
					new CombatActionSetError(
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
					new CombatActionSetError(
						'invalid-config',
						`Action config "${definition.key}" is required but no value or default was provided`,
						`${path}.${definition.key}`
					)
				);
				continue;
			}

			const error = definition.validateValue(value);

			if (error) {
				errors.push(
					new CombatActionSetError(
						'invalid-config',
						`Invalid value for action config "${definition.key}": ${error.message}`,
						`${path}.${definition.key}`
					)
				);
			}
		}

		return errors;
	}

	private static validatePlugin(
		plugin: CombatActionSetPlugin,
		versionValidator: ContractVersionValidator,
		errors: CombatActionSetError[]
	): void {
		if (!this.isNonEmpty(plugin.id)) {
			errors.push(
				new CombatActionSetError('invalid-plugin-id', 'Combat action set plugin id is required', 'plugin.id')
			);
		}

		if (!this.isNonEmpty(plugin.contractVersion)) {
			errors.push(
				new CombatActionSetError(
					'invalid-version-range',
					'Combat action set plugin contract version range is required',
					'plugin.contractVersion'
				)
			);
		} else if (!versionValidator.isValidRange(plugin.contractVersion)) {
			errors.push(
				new CombatActionSetError(
					'invalid-version-range',
					`Combat action set plugin contract version range "${plugin.contractVersion}" is not valid`,
					'plugin.contractVersion'
				)
			);
		}
	}

	/**
	 * Finds the binding registered for a Move.
	 *
	 * @param moveId - Move identifier.
	 * @returns The matching binding, or `undefined` when the Move is not bound.
	 */
	find(moveId: string): CombatMoveBinding | undefined {
		return this.bindings.find(binding => binding.moveId === moveId);
	}

	/**
	 * Serializes this action set into its primitive representation.
	 *
	 * @returns A plain {@link CombatActionSetPrimitives} snapshot.
	 */
	toPrimitives(): CombatActionSetPrimitives {
		return {
			bindings: this.bindings.map(binding => binding.toPrimitives()),
			plugin: { ...this.plugin },
		};
	}
}

export type { CombatActionSetPlugin, CombatActionSetPrimitives, CombatMoveBindingPrimitives };
export { CombatMoveBinding };
export default CombatActionSet;
