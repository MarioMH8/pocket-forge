import type { CombatMoveBindingPrimitives } from '@pocket-forge/combat/domain';
import { MODIFY_ATTRIBUTE_ACTION_ID, REFERENCE_CONFIG_KEYS } from '@pocket-forge/combat-reference/domain';

/**
 * Authored reference bindings shared by tests and examples.
 */
const REFERENCE_MOVE_BINDINGS: readonly CombatMoveBindingPrimitives[] = [
	{
		actionId: MODIFY_ATTRIBUTE_ACTION_ID,
		config: {
			[REFERENCE_CONFIG_KEYS.amount]: 5,
			[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
			[REFERENCE_CONFIG_KEYS.operation]: 'add',
			[REFERENCE_CONFIG_KEYS.scope]: 'combatant',
		},
		moveId: 'move-1',
	},
	{
		actionId: MODIFY_ATTRIBUTE_ACTION_ID,
		config: {
			[REFERENCE_CONFIG_KEYS.amount]: 25,
			[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
			[REFERENCE_CONFIG_KEYS.operation]: 'set',
			[REFERENCE_CONFIG_KEYS.probability]: 0.5,
			[REFERENCE_CONFIG_KEYS.scope]: 'group',
		},
		moveId: 'move-2',
	},
];

/**
 * Object Mother for authored reference Combat action set bindings.
 */
export default class ReferenceCombatActionSetMother {
	/**
	 * Builds one authored binding.
	 *
	 * @param overrides - Binding fields to replace.
	 * @returns A fresh binding primitive.
	 */
	static binding(overrides?: Partial<CombatMoveBindingPrimitives>): CombatMoveBindingPrimitives {
		const [first] = REFERENCE_MOVE_BINDINGS;

		if (!first) {
			throw new Error('Reference action set mother requires at least one binding');
		}

		return {
			...first,
			config: { ...first.config },
			...overrides,
		};
	}

	/**
	 * Builds the example authored bindings.
	 *
	 * @returns Fresh copies of the example bindings.
	 */
	static bindings(): CombatMoveBindingPrimitives[] {
		return REFERENCE_MOVE_BINDINGS.map(binding => ({ ...binding, config: { ...binding.config } }));
	}
}

export { REFERENCE_MOVE_BINDINGS };
