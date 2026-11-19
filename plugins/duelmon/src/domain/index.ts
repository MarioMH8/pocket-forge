export { MODIFY_ATTRIBUTE_ACTION_ID } from './action/duelmon.constants';
export { default as DuelmonActionCatalog, MODIFY_ATTRIBUTE_DESCRIPTOR } from './action/duelmon-action.catalog';
export type { DuelmonCombatInput, DuelmonCombatTarget } from './action/duelmon-combat.input';
export { default as DuelmonCombatPlugin } from './action/duelmon-combat.plugin';
export type { DuelmonOperation, DuelmonTargetScope } from './action/modify-attribute.config';
export {
	DUELMON_CONFIG_KEYS,
	DUELMON_OPERATIONS,
	DUELMON_SCOPES,
	MODIFY_ATTRIBUTE_CONFIG_DEFINITIONS,
	validateModifyAttributeConfig,
} from './action/modify-attribute.config';
