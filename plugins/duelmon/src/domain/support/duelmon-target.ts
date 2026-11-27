import Either from '@hexadrop/either';
import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, Combatant, CombatantGroup, CombatPrimitives } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';

import { DuelmonFailure } from './duelmon-failure';
import { DuelmonRecord } from './duelmon-record';

/**
 * Scopes supported by Duelmon actions.
 */
const DUELMON_TARGET_SCOPES = ['combat', 'combatant', 'group'] as const;

/**
 * Scope addressed by a Duelmon action.
 */
type DuelmonTargetScope = (typeof DUELMON_TARGET_SCOPES)[number];

/**
 * The combat entity addressed by a resolved Duelmon target.
 *
 * The resolved value owns both the current attribute values and the write
 * path, so actions never repeat a scope switch.
 */
class ResolvedDuelmonTarget {
	/**
	 * Resolved combatant, when the target scope is `combatant`.
	 */
	readonly combatant: Combatant | undefined;
	/**
	 * Resolved combatant group, when the target scope is `group`.
	 */
	readonly group: CombatantGroup | undefined;
	/**
	 * Target identifier. Undefined for the `combat` scope.
	 */
	readonly id: string | undefined;
	/**
	 * Scope addressed by the action.
	 */
	readonly scope: DuelmonTargetScope;
	/**
	 * Current attribute values of the resolved target.
	 */
	readonly values: AttributeValues;

	private constructor(
		scope: DuelmonTargetScope,
		values: AttributeValues,
		id?: string,
		combatant?: Combatant,
		group?: CombatantGroup
	) {
		this.scope = scope;
		this.values = values;
		this.id = id;
		this.combatant = combatant;
		this.group = group;
	}

	/**
	 * Builds a resolved combat target.
	 *
	 * @param combat - Current combat snapshot.
	 * @returns A target that writes combat attributes.
	 */
	static fromCombat(combat: Combat): ResolvedDuelmonTarget {
		return new ResolvedDuelmonTarget('combat', combat.attributes.toPrimitives());
	}

	/**
	 * Builds a resolved combatant target.
	 *
	 * @param combatant - Resolved combatant.
	 * @returns A target that writes combatant attributes.
	 */
	static fromCombatant(combatant: Combatant): ResolvedDuelmonTarget {
		return new ResolvedDuelmonTarget('combatant', combatant.attributes.toPrimitives(), combatant.id, combatant);
	}

	/**
	 * Builds a resolved group target.
	 *
	 * @param group - Resolved combatant group.
	 * @returns A target that writes group attributes.
	 */
	static fromGroup(group: CombatantGroup): ResolvedDuelmonTarget {
		return new ResolvedDuelmonTarget('group', group.attributes.toPrimitives(), group.id, undefined, group);
	}

	/**
	 * Replaces one attribute on the resolved entity.
	 *
	 * @param primitives - Combat primitives to copy.
	 * @param attributeKey - Attribute key.
	 * @param value - Replacement value.
	 * @returns A new primitives snapshot with the replacement applied.
	 */
	writeAttribute(primitives: CombatPrimitives, attributeKey: string, value: AttributeValue): CombatPrimitives {
		switch (this.scope) {
			case 'combat': {
				return {
					...primitives,
					attributes: { ...primitives.attributes, [attributeKey]: value },
				};
			}
			case 'combatant': {
				if (this.id === undefined) {
					return primitives;
				}

				return {
					...primitives,
					groups: primitives.groups.map(group => ({
						...group,
						combatants: group.combatants.map(combatant =>
							combatant.id === this.id
								? {
										...combatant,
										attributes: { ...combatant.attributes, [attributeKey]: value },
									}
								: combatant
						),
					})),
				};
			}
			case 'group': {
				if (this.id === undefined) {
					return primitives;
				}

				return {
					...primitives,
					groups: primitives.groups.map(group =>
						group.id === this.id
							? { ...group, attributes: { ...group.attributes, [attributeKey]: value } }
							: group
					),
				};
			}
		}
	}
}

/**
 * Scope selection carried by the Duelmon plugin input.
 *
 * A target is parsed from untrusted input and later resolved against a Combat
 * with the scope expected by the action being resolved.
 */
class DuelmonTarget {
	/**
	 * Scopes supported by Duelmon actions.
	 */
	static readonly SCOPES: readonly DuelmonTargetScope[] = DUELMON_TARGET_SCOPES;

	/**
	 * Optional target identifier. Required for `group` and `combatant`.
	 */
	readonly id: string | undefined;
	/**
	 * Scope addressed by the action.
	 */
	readonly scope: DuelmonTargetScope;

	private constructor(scope: DuelmonTargetScope, id: string | undefined) {
		this.scope = scope;
		this.id = id;
	}

	/**
	 * Creates a target from already validated values.
	 *
	 * @param scope - Scope addressed by the action.
	 * @param id - Optional target identifier.
	 * @returns An immutable target value.
	 * @example
	 * ```ts
	 * const target = DuelmonTarget.create('combatant', 'combatant-a');
	 *
	 * target.scope; // 'combatant'
	 * target.id; // 'combatant-a'
	 * ```
	 */
	static create(scope: DuelmonTargetScope, id?: string): DuelmonTarget {
		return new DuelmonTarget(scope, id);
	}

	/**
	 * Finds a combatant across every group in a combat.
	 *
	 * @param combat - Combat snapshot to search.
	 * @param combatantId - Combatant identifier.
	 * @returns The matching combatant, or `undefined` when it is unknown.
	 */
	static findCombatant(combat: Combat, combatantId: string): Combatant | undefined {
		return combat.groups.flatMap(group => group.combatants).find(combatant => combatant.id === combatantId);
	}

	/**
	 * Narrows an unknown value to a supported target scope.
	 *
	 * @param value - Candidate scope.
	 * @returns Whether the value is supported.
	 */
	static isScope(value: unknown): value is DuelmonTargetScope {
		return typeof value === 'string' && (DUELMON_TARGET_SCOPES as readonly string[]).includes(value);
	}

	/**
	 * Validates an untrusted target shape.
	 *
	 * @param value - Untrusted plugin input target.
	 * @returns The validated target, or structured `invalid-input` failures.
	 */
	static parse(value: unknown): Either<CombatResolutionError[], DuelmonTarget> {
		if (!DuelmonRecord.isRecord(value)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input target must be an object',
				'input.target'
			);
		}

		const scope = value['scope'];

		if (!this.isScope(scope)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input target scope must be one of: combat, group, combatant',
				'input.target.scope'
			);
		}

		const id = value['id'];

		if (id !== undefined && !this.isNonEmptyString(id)) {
			return DuelmonFailure.fail(
				'invalid-input',
				'Duelmon combat input target id must be a non-empty string when provided',
				'input.target.id'
			);
		}

		return Either.right(new DuelmonTarget(scope, id));
	}

	/**
	 * Narrows an unknown value to a non-empty string.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is a non-empty string.
	 */
	private static isNonEmptyString(value: unknown): value is string {
		return typeof value === 'string' && value.trim().length > 0;
	}

	/**
	 * Resolves this target against a combat with the scope expected by an
	 * action.
	 *
	 * @param combat - Current combat snapshot.
	 * @param expectedScope - Scope required by the action.
	 * @returns The resolved target, or a structured `invalid-target` failure.
	 */
	resolve(combat: Combat, expectedScope: DuelmonTargetScope): Either<CombatResolutionError[], ResolvedDuelmonTarget> {
		if (this.scope !== expectedScope) {
			return DuelmonFailure.fail(
				'invalid-target',
				`Action targets scope "${expectedScope}", received "${this.scope}"`,
				'input.target.scope'
			);
		}

		switch (this.scope) {
			case 'combat': {
				return Either.right(ResolvedDuelmonTarget.fromCombat(combat));
			}
			case 'combatant': {
				if (!this.id) {
					return DuelmonFailure.fail(
						'invalid-target',
						'Target scope "combatant" requires a combatant id',
						'input.target.id'
					);
				}

				const combatant = DuelmonTarget.findCombatant(combat, this.id);

				if (!combatant) {
					return DuelmonFailure.fail('invalid-target', `Unknown combatant "${this.id}"`, 'input.target.id');
				}

				return Either.right(ResolvedDuelmonTarget.fromCombatant(combatant));
			}
			case 'group': {
				if (!this.id) {
					return DuelmonFailure.fail(
						'invalid-target',
						'Target scope "group" requires a group id',
						'input.target.id'
					);
				}

				const group = combat.groups.find(groupEntry => groupEntry.id === this.id);

				if (!group) {
					return DuelmonFailure.fail(
						'invalid-target',
						`Unknown combatant group "${this.id}"`,
						'input.target.id'
					);
				}

				return Either.right(ResolvedDuelmonTarget.fromGroup(group));
			}
		}
	}
}

export type { DuelmonTargetScope };
export { DuelmonTarget, ResolvedDuelmonTarget };

export default DuelmonTarget;
