import type Either from '@hexadrop/either';
import type {
	CombatActionCatalog,
	CombatActionSet,
	CombatActionSetError,
	CombatMoveBindingPrimitives,
	ContractVersionValidator,
} from '@pocket-forge/combat/domain';
import { CombatActionSet as CombatActionSetEntity } from '@pocket-forge/combat/domain';

import { REFERENCE_PLUGIN_CONTRACT_RANGE, REFERENCE_PLUGIN_ID } from './reference-combat.constants';

/**
 * Authored action set helper for the reference Combat plugin.
 *
 * It fixes the plugin reference and delegates every validation rule to
 * {@link CombatActionSetEntity.create}, so bindings are checked against the
 * plugin catalog and the injected contract version port.
 */
class ReferenceCombatActionSet {
	/**
	 * Validates authored bindings and builds an immutable action set.
	 *
	 * @param bindings - Move-to-action bindings authored by content.
	 * @param catalog - Plugin-owned action catalog.
	 * @param versionValidator - Domain port that validates version ranges.
	 * @returns The validated action set, or every validation failure.
	 */
	static create(
		bindings: readonly CombatMoveBindingPrimitives[],
		catalog: CombatActionCatalog,
		versionValidator: ContractVersionValidator
	): Either<CombatActionSetError[], CombatActionSet> {
		return CombatActionSetEntity.create(
			{
				bindings: [...bindings],
				plugin: {
					contractVersion: REFERENCE_PLUGIN_CONTRACT_RANGE,
					id: REFERENCE_PLUGIN_ID,
				},
			},
			catalog,
			versionValidator
		);
	}
}

export default ReferenceCombatActionSet;
