export type { ReferenceOperation, ReferenceTargetScope } from './action/modify-attribute.config';
export {
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	REFERENCE_CONFIG_KEYS,
	REFERENCE_OPERATIONS,
	REFERENCE_SCOPES,
	validateModifyAttributeConfig,
} from './action/modify-attribute.config';
export {
	MODIFY_ATTRIBUTE_DESCRIPTOR,
	default as ReferenceCombatActionCatalog,
} from './action/reference-combat.catalog';
export {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_PLUGIN_CONTRACT_RANGE,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
} from './action/reference-combat.constants';
export type { ReferenceCombatInput, ReferenceCombatTarget } from './action/reference-combat.input';
export { default as ReferenceCombatPlugin } from './action/reference-combat.plugin';
export { default as ReferenceCombatActionSet } from './action/reference-combat-action-set';
