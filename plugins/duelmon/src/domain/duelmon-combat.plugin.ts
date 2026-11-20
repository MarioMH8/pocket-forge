import Either from '@hexadrop/either';
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';
import type {
	CombatActionContext,
	CombatActionResolver,
	CombatResolutionError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';

import type DuelmonAction from './action/duelmon-action';
import { DuelmonActionCatalog } from './action/duelmon-action.catalog';
import type DuelmonActionResolver from './action/duelmon-action.resolver';
import { ModifyAttributeAction } from './action/modify-attribute/modify-attribute.action';
import { UseMoveAction } from './action/use-move/use-move.action';
import type { UseMoveMechanics } from './action/use-move/use-move.mechanics';
import { DuelmonCombatInput } from './support/duelmon-combat.input';
import { DuelmonFailure } from './support/duelmon-failure';

/**
 * Duelmon Combat plugin.
 *
 * It owns its action catalog, its input shape, and the resolver registry. The
 * project attribute definitions, the neutral Duelmon catalog, and the
 * generation mechanics are injected by the composition edge: actions validate
 * and saturate against the attribute catalog, resolve moves and species
 * through the dataset catalog, and keep generation rules behind the seam.
 */
class DuelmonCombatPlugin implements CombatActionResolver {
	/**
	 * Actions registered by this plugin.
	 */
	readonly actions: DuelmonActionCatalog;
	private readonly resolvers: ReadonlyMap<string, DuelmonActionResolver>;

	constructor(
		attributeDefinitions: readonly AttributeDefinition[],
		catalog: DuelmonCatalog,
		mechanics: UseMoveMechanics
	) {
		const actions = DuelmonCombatPlugin.createActions(attributeDefinitions, catalog, mechanics);

		const resolvers = new Map<string, DuelmonActionResolver>();

		for (const action of actions) {
			resolvers.set(action.id, action);
		}

		this.actions = new DuelmonActionCatalog(actions);
		this.resolvers = resolvers;
	}

	/**
	 * Builds the registered actions.
	 *
	 * Adding an action means adding its class to this list and exporting it;
	 * the catalog and resolver map are derived from the same list.
	 *
	 * @param attributeDefinitions - Project attribute definitions.
	 * @param catalog - Neutral Duelmon catalog.
	 * @param mechanics - Generation-specific move mechanics.
	 * @returns Every action registered by this plugin.
	 */
	private static createActions(
		attributeDefinitions: readonly AttributeDefinition[],
		catalog: DuelmonCatalog,
		mechanics: UseMoveMechanics
	): readonly DuelmonAction[] {
		return [
			new ModifyAttributeAction(attributeDefinitions),
			new UseMoveAction(catalog, mechanics, attributeDefinitions),
		];
	}

	/**
	 * Resolves a bound Duelmon action into a successor Combat.
	 *
	 * The plugin only parses the input, finds the binding, and delegates to the
	 * resolver registered for the bound action.
	 *
	 * @param context - Immutable action context.
	 * @returns The resulting transition, or every resolution failure.
	 */
	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		const parsedInput = DuelmonCombatInput.parse(context.input);

		if (parsedInput.isLeft()) {
			return Either.left(parsedInput.getLeft());
		}

		const input = parsedInput.getRight();
		const binding = context.actionBindings.find(input.moveId);

		if (!binding) {
			return DuelmonFailure.fail(
				'invalid-action',
				`No combat action is bound to Move "${input.moveId}"`,
				'input.moveId'
			);
		}

		const resolver = this.resolvers.get(binding.actionId);

		if (!resolver) {
			return DuelmonFailure.fail(
				'invalid-action',
				`Move "${input.moveId}" is bound to unsupported action "${binding.actionId}"`,
				'actionBindings.bindings'
			);
		}

		return resolver.resolve(context, input, binding);
	}
}

export { DuelmonCombatPlugin };

export default DuelmonCombatPlugin;
