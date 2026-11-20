export { DuelmonCombatAttributes } from './action/combat-attributes';
export { DuelmonErrors } from './action/duelmon.errors';
export type { default as DuelmonAction } from './action/duelmon-action';
export { DuelmonActionCatalog } from './action/duelmon-action.catalog';
export type { default as DuelmonActionResolver } from './action/duelmon-action.resolver';
export { DuelmonCombatInput } from './action/duelmon-combat.input';
export { DuelmonCombatPlugin } from './action/duelmon-combat.plugin';
export type { DuelmonTargetScope } from './action/duelmon-target';
export { DuelmonTarget, ResolvedDuelmonTarget } from './action/duelmon-target';
export { ModifyAttributeAction } from './action/modify-attribute/modify-attribute.action';
export type { DuelmonOperation } from './action/modify-attribute/modify-attribute.config';
export { ModifyAttributeConfig } from './action/modify-attribute/modify-attribute.config';
export { Gen1BattleStats } from './action/use-move/gen1/gen1-battle-stats';
export type { Gen1DamageInput } from './action/use-move/gen1/gen1-damage';
export { Gen1Damage } from './action/use-move/gen1/gen1-damage';
export { Gen1UseMoveMechanics } from './action/use-move/gen1/gen1-use-move.mechanics';
export { UseMoveAction } from './action/use-move/use-move.action';
export type {
	UseMoveAttributes,
	UseMoveInput,
	UseMoveMechanics,
	UseMoveOutcome,
} from './action/use-move/use-move.mechanics';
export { UseMoveResolution } from './action/use-move/use-move.resolution';
export type {
	AttributeModificationFailedEvent,
	AttributeModificationFailedPayload,
	AttributeModifiedEvent,
	AttributeModifiedPayload,
	DuelmonCombatEvent,
	DuelmonCombatEventType,
	MoveMissedEvent,
	MoveMissedPayload,
	MoveUsedEvent,
	MoveUsedPayload,
} from './event';
export { DUELMON_COMBAT_EVENT_TYPES, DuelmonCombatEvents } from './event';
