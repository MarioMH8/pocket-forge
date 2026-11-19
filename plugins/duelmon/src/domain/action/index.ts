export { MODIFY_ATTRIBUTE_ACTION_ID } from './duelmon.constants';
export { default as DuelmonActionCatalog, MODIFY_ATTRIBUTE_DESCRIPTOR } from './duelmon-action.catalog';
export type { DuelmonCombatInput, DuelmonCombatTarget } from './duelmon-combat.input';
export { default as DuelmonCombatPlugin } from './duelmon-combat.plugin';
export type { DuelmonOperation, DuelmonTargetScope } from './modify-attribute.config';
export {
	DUELMON_CONFIG_KEYS,
	DUELMON_OPERATIONS,
	DUELMON_SCOPES,
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	validateModifyAttributeConfig,
} from './modify-attribute.config';
