export type { ReferenceOperation, ReferenceTargetScope } from './modify-attribute.config';
export {
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	REFERENCE_CONFIG_KEYS,
	REFERENCE_OPERATIONS,
	REFERENCE_SCOPES,
	validateModifyAttributeConfig,
} from './modify-attribute.config';
export { MODIFY_ATTRIBUTE_DESCRIPTOR, default as ReferenceCombatActionCatalog } from './reference-combat.catalog';
export {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_PLUGIN_CONTRACT_RANGE,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
} from './reference-combat.constants';
export type { ReferenceCombatInput, ReferenceCombatTarget } from './reference-combat.input';
export { default as ReferenceCombatPlugin } from './reference-combat.plugin';
export { default as ReferenceCombatActionSet } from './reference-combat-action-set';
