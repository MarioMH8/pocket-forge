import Either from '@hexadrop/either';
import type { Combat } from '@pocket-forge/combat/domain';
import type { CombatResolutionError } from '@pocket-forge/combat-engine/domain';
import { CombatResolutionError as CombatResolutionErrorEntity } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';

import { DuelmonCombat } from '../combat/duelmon-combat';
import type { DuelmonCombatantGroup } from '../combat/duelmon-combatant-group';
import { Phase1MoveConstraints } from '../start/phase-1-move.constraints';
import { DuelmonCombatInput } from '../support/duelmon-combat.input';
import { DuelmonTurnDeclaration } from './duelmon-turn-declaration';

/**
 * Adds the position of a declaration to the path of a nested failure.
 *
 * @param error - Failure produced while parsing or validating one declaration.
 * @param prefix - Path of the declaration inside the received list.
 * @returns A failure that keeps the reason and message with a prefixed path.
 */
function prefixPath(error: CombatResolutionError, prefix: string): CombatResolutionError {
	return new CombatResolutionErrorEntity(
		error.reason,
		error.message,
		error.path === undefined ? prefix : `${prefix}.${error.path}`
	);
}

/**
 * Collects the strict one-versus-one shape required by Phase 1.
 *
 * @param groups - Groups of the combat in combat order.
 * @returns Every combat-shape failure.
 */
function phaseOneShapeErrors(groups: readonly DuelmonCombatantGroup[]): CombatResolutionError[] {
	const errors: CombatResolutionError[] = [];

	if (groups.length !== 2) {
		errors.push(
			new CombatResolutionErrorEntity(
				'incompatible-contract',
				`Phase 1 requires exactly two groups, received ${String(groups.length)}`,
				'combat.groups'
			)
		);
	}

	for (const [index, group] of groups.entries()) {
		const activeCombatantIds = group.activeCombatantIds;

		if (activeCombatantIds.length !== 1) {
			errors.push(
				new CombatResolutionErrorEntity(
					'incompatible-contract',
					`Phase 1 group "${group.id}" requires exactly one active combatant, received ${String(activeCombatantIds.length)}`,
					`combat.groups.${String(index)}.attributes.activeCombatantIds`
				)
			);
		}
	}

	return errors;
}

/**
 * The two declarations of one Phase 1 turn, validated together.
 *
 * The set receives one unparsed declaration per combat group, parses and
 * validates each one through the single-declaration contract, and only exists
 * when both sides declared a valid action. It never resolves the actions,
 * changes the `Combat`, or consumes randomness.
 *
 * Declarations are exposed in combat order (group order, then combatant order),
 * so the result does not depend on the order in which they arrived. Speed
 * ordering belongs to the turn service that consumes the set.
 */
class DuelmonTurnDeclarations {
	private readonly byActorId: ReadonlyMap<string, DuelmonTurnDeclaration>;
	private readonly byGroupId: ReadonlyMap<string, DuelmonTurnDeclaration>;
	private readonly list: readonly DuelmonTurnDeclaration[];

	private constructor(declarations: readonly DuelmonTurnDeclaration[]) {
		this.list = Object.freeze([...declarations]);
		this.byActorId = new Map(declarations.map(declaration => [declaration.actor.id, declaration]));
		this.byGroupId = new Map(declarations.map(declaration => [declaration.actor.groupId, declaration]));
	}

	/**
	 * Receives and validates the declarations of one Phase 1 turn.
	 *
	 * Every declaration is parsed with `DuelmonCombatInput.parse` and validated
	 * with `DuelmonTurnDeclaration.validate`. The turn boundary also applies the
	 * Phase 1 move-support policy, so a Move the combat start would reject cannot
	 * enter a turn either. The set-level rules require a strict one-versus-one
	 * combat and exactly one declaration per group, so a missing, extra, or
	 * duplicated declaration is rejected before anything is resolved. Every
	 * failure found in the pass is aggregated, and its path is prefixed with
	 * `declarations.<index>`.
	 *
	 * The policy lives here and not in `DuelmonTurnDeclaration.validate` or the
	 * plugin: the generic engine keeps resolving any bound action, while a Phase 1
	 * turn only accepts supported content.
	 *
	 * @param catalog - Duelmon catalog.
	 * @param combat - Current combat snapshot.
	 * @param declarations - Unparsed declarations, one per group.
	 * @returns The validated declaration set, or every failure.
	 * @example
	 * ```ts
	 * const declarations = DuelmonTurnDeclarations.receive(catalog, combat, [
	 * 	{ actorId: 'player-emberling', moveId: 'ember-burst', target: { id: 'opponent-aquafin', scope: 'combatant' } },
	 * 	{ actorId: 'opponent-aquafin', moveId: 'aqua-burst', target: { id: 'player-emberling', scope: 'combatant' } },
	 * ]);
	 * ```
	 */
	static receive(
		catalog: DuelmonCatalog,
		combat: Combat,
		declarations: unknown
	): Either<CombatResolutionError[], DuelmonTurnDeclarations> {
		const groups = DuelmonCombat.fromCombat(combat).groups();
		const shapeErrors = phaseOneShapeErrors(groups);

		if (shapeErrors.length > 0) {
			return Either.left(shapeErrors);
		}

		if (!Array.isArray(declarations)) {
			return Either.left([
				new CombatResolutionErrorEntity(
					'invalid-input',
					'A Phase 1 turn requires one declaration per group',
					'declarations'
				),
			]);
		}

		const inputs: readonly unknown[] = declarations;
		const errors: CombatResolutionError[] = [];

		if (inputs.length !== 2) {
			errors.push(
				new CombatResolutionErrorEntity(
					'invalid-input',
					`A Phase 1 turn requires exactly one declaration per group, received ${String(inputs.length)}`,
					'declarations'
				)
			);
		}

		const accepted: DuelmonTurnDeclaration[] = [];
		const firstActorIndex = new Map<string, number>();
		const firstGroupIndex = new Map<string, number>();

		for (const [index, input] of inputs.entries()) {
			const path = `declarations.${String(index)}`;
			const parsed = DuelmonCombatInput.parse(input);

			if (parsed.isLeft()) {
				errors.push(...parsed.getLeft().map(error => prefixPath(error, path)));

				continue;
			}

			const validated = DuelmonTurnDeclaration.validate(catalog, combat, parsed.getRight());

			if (validated.isLeft()) {
				errors.push(...validated.getLeft().map(error => prefixPath(error, path)));

				continue;
			}

			const declaration = validated.getRight();
			const actorIndex = firstActorIndex.get(declaration.actor.id);

			if (actorIndex !== undefined) {
				errors.push(
					new CombatResolutionErrorEntity(
						'invalid-input',
						`Duplicate declaration for actor "${declaration.actor.id}" (already declared at declarations.${String(actorIndex)})`,
						`${path}.input.actorId`
					)
				);

				continue;
			}

			/*
			 * The strict 1v1 shape makes a group-level duplicate unreachable after the actor check;
			 * the guard keeps the one-declaration-per-group rule explicit if that shape changes.
			 */
			const groupIndex = firstGroupIndex.get(declaration.actor.groupId);

			if (groupIndex !== undefined) {
				errors.push(
					new CombatResolutionErrorEntity(
						'invalid-input',
						`Group "${declaration.actor.groupId}" already declared an action at declarations.${String(groupIndex)}`,
						`${path}.input.actorId`
					)
				);

				continue;
			}

			const unsupportedReason = Phase1MoveConstraints.unsupportedReason(declaration.move);

			if (unsupportedReason !== undefined) {
				errors.push(new CombatResolutionErrorEntity('rejected', unsupportedReason, `${path}.input.moveId`));

				continue;
			}

			firstActorIndex.set(declaration.actor.id, index);
			firstGroupIndex.set(declaration.actor.groupId, index);
			accepted.push(declaration);
		}

		for (const group of groups) {
			if (!firstGroupIndex.has(group.id)) {
				errors.push(
					new CombatResolutionErrorEntity(
						'invalid-input',
						`Missing declaration for group "${group.id}"`,
						'declarations'
					)
				);
			}
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		const ordered: DuelmonTurnDeclaration[] = [];

		for (const group of groups) {
			const declaration = accepted.find(candidate => candidate.actor.groupId === group.id);

			if (declaration) {
				ordered.push(declaration);
			}
		}

		return Either.right(new DuelmonTurnDeclarations(ordered));
	}

	/**
	 * Finds the declaration of one actor.
	 *
	 * @param actorId - Acting combatant identifier.
	 * @returns The declaration, or `undefined` when the actor did not declare.
	 */
	declarationForActor(actorId: string): DuelmonTurnDeclaration | undefined {
		return this.byActorId.get(actorId);
	}

	/**
	 * Finds the declaration of one group.
	 *
	 * @param groupId - Combatant group identifier.
	 * @returns The declaration, or `undefined` when the group did not declare.
	 */
	declarationForGroup(groupId: string): DuelmonTurnDeclaration | undefined {
		return this.byGroupId.get(groupId);
	}

	/**
	 * Declarations in combat order.
	 *
	 * @returns The validated declarations, one per group.
	 */
	declarations(): readonly DuelmonTurnDeclaration[] {
		return this.list;
	}
}

export { DuelmonTurnDeclarations };

export default DuelmonTurnDeclarations;
