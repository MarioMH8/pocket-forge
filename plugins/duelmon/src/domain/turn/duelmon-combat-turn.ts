import Either from '@hexadrop/either';
import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { Combat } from '@pocket-forge/combat/domain';
import type {
	CombatEngine,
	CombatEngineFailure,
	CombatEvent,
	CombatOutcome,
	CombatResolution,
} from '@pocket-forge/combat-engine/domain';
import { CombatResolution as CombatResolutionEntity } from '@pocket-forge/combat-engine/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';

import { DuelmonCombat } from '../combat/duelmon-combat';
import { DuelmonCombatant } from '../combat/duelmon-combatant';
import { DuelmonSpeedOrder } from './duelmon-speed-order';
import type { DuelmonTurnDeclaration } from './duelmon-turn-declaration';
import { DuelmonTurnDeclarations } from './duelmon-turn-declarations';

/**
 * Input handed to the engine for one declared action.
 *
 * The service always passes primitives instead of the snapshot objects kept by
 * the declaration, so the plugin re-validates and resolves against the combat
 * state that is current when the action runs.
 */
interface DuelmonTurnActionInput {
	readonly actorId: string;
	readonly moveId: string;
	readonly target: {
		readonly id: string;
		readonly scope: 'combatant';
	};
}

/**
 * Phase 1 combat turn.
 *
 * The service receives the two declarations of a turn, orders them with
 * {@link DuelmonSpeedOrder}, and resolves each declared action through the
 * injected Combat Engine, threading the successor Combat of one action into the
 * next one. It returns a single {@link CombatResolution} with the merged events
 * renumbered in turn order.
 *
 * Phase 1 only compares raw Speed: priority, stat stages, paralysis, and random
 * tie-breaks are not applied. A declaration is input, not state; the service
 * never stores a pending action in `Combat`.
 */
class DuelmonCombatTurn {
	private readonly catalog: DuelmonCatalog;
	private readonly engine: CombatEngine;

	constructor(catalog: DuelmonCatalog, engine: CombatEngine) {
		this.catalog = catalog;
		this.engine = engine;
	}

	/**
	 * Plans the action input of one declaration.
	 *
	 * @param declaration - Validated declaration.
	 * @returns The primitive input consumed by the plugin.
	 */
	private static actionInput(declaration: DuelmonTurnDeclaration): DuelmonTurnActionInput {
		return {
			actorId: declaration.actor.id,
			moveId: declaration.moveId,
			target: { id: declaration.target.id, scope: 'combatant' },
		};
	}

	/**
	 * Checks whether an actor can still act in the current combat state.
	 *
	 * The actor is looked up in the vigent snapshot instead of the declaration,
	 * which keeps the object captured at validation time out of the decision.
	 *
	 * @param combat - Current combat state.
	 * @param actorId - Acting combatant identifier.
	 * @returns Whether the actor exists and has positive hit points.
	 */
	private static isStanding(combat: Combat, actorId: string): boolean {
		for (const group of DuelmonCombat.fromCombat(combat).groups()) {
			const combatant = group.combatant(actorId);

			if (combatant) {
				return !combatant.isFainted;
			}
		}

		return false;
	}

	/**
	 * Orders declarations by Phase 1 speed order.
	 *
	 * The order is built once from the starting combat and applied to the
	 * combatant views of the declarations. Higher Speed goes first; equal Speed
	 * falls back to the combatant position in the Combat.
	 *
	 * @param combat - Combat that defines the order.
	 * @param declarations - Validated declarations, one per group.
	 * @returns The declarations sorted from fastest to slowest.
	 * @throws {InvalidArgumentError} When an ordered combatant has no matching
	 * declaration.
	 */
	private static orderDeclarations(
		combat: Combat,
		declarations: readonly DuelmonTurnDeclaration[]
	): readonly DuelmonTurnDeclaration[] {
		const byActorId = new Map<string, DuelmonTurnDeclaration>(
			declarations.map(declaration => [declaration.actor.id, declaration])
		);
		const orderedCombatants = DuelmonSpeedOrder.fromCombat(combat).sort(
			declarations.map(declaration => DuelmonCombatant.fromCombatant(declaration.actor))
		);

		const ordered: DuelmonTurnDeclaration[] = [];

		for (const combatant of orderedCombatants) {
			const declaration = byActorId.get(combatant.id);

			if (!declaration) {
				throw new InvalidArgumentError(
					`Declaration for combatant "${combatant.id}" is missing`,
					'DuelmonCombatTurn'
				);
			}

			ordered.push(declaration);
		}

		return ordered;
	}

	/**
	 * Renumbers the events of one action after the events already merged.
	 *
	 * @param events - Events produced by one action, starting at one.
	 * @param offset - Number of events already merged in turn order.
	 * @returns The events with a continuous sequence.
	 */
	private static renumber(events: readonly CombatEvent[], offset: number): readonly CombatEvent[] {
		return events.map((event, index) => ({ ...event, sequence: offset + index + 1 }));
	}

	/**
	 * Resolves the two declarations of one Phase 1 turn.
	 *
	 * Declarations are received and validated first; an invalid set resolves
	 * nothing and consumes no randomness. Valid declarations are sorted by
	 * Speed, then each action is resolved in sequence through the Combat Engine
	 * with the successor combat of the previous action. An actor that no longer
	 * has positive hit points is skipped. The events of every action are merged
	 * in turn order and renumbered from one, and the engine outcome is kept when
	 * an action completes the combat, which also stops the loop.
	 *
	 * A failed action returns the engine failures instead of a partial
	 * resolution. The caller keeps the original `Combat` and `RandomPocket`: the
	 * engine and the actions are pure, so no state is persisted on failure.
	 *
	 * @param combat - Active combat snapshot that starts the turn.
	 * @param declarations - Unparsed declarations, one per combat group.
	 * @returns One resolution with the final combat, merged events, and the
	 * reached outcome, or every failure.
	 * @example
	 * ```ts
	 * const turn = new DuelmonCombatTurn(catalog, engine);
	 * const resolution = turn.resolve(combat, [
	 * 	{ actorId: 'player-emberling', moveId: 'ember-burst', target: { id: 'opponent-aquafin', scope: 'combatant' } },
	 * 	{ actorId: 'opponent-aquafin', moveId: 'aqua-burst', target: { id: 'player-emberling', scope: 'combatant' } },
	 * ]);
	 * ```
	 */
	resolve(combat: Combat, declarations: unknown): Either<CombatEngineFailure[], CombatResolution> {
		const received = DuelmonTurnDeclarations.receive(this.catalog, combat, declarations);

		if (received.isLeft()) {
			return Either.left(received.getLeft());
		}

		const ordered = DuelmonCombatTurn.orderDeclarations(combat, received.getRight().declarations());

		let current = combat;
		let outcome: CombatOutcome | undefined;
		const events: CombatEvent[] = [];

		for (const declaration of ordered) {
			if (!DuelmonCombatTurn.isStanding(current, declaration.actor.id)) {
				continue;
			}

			const resolution = this.engine.resolve(current, DuelmonCombatTurn.actionInput(declaration));

			if (resolution.isLeft()) {
				return Either.left(resolution.getLeft());
			}

			const resolved = resolution.getRight();

			current = resolved.combat;
			events.push(...DuelmonCombatTurn.renumber(resolved.events, events.length));

			if (resolved.outcome) {
				outcome = resolved.outcome;

				break;
			}
		}

		return Either.right(CombatResolutionEntity.create(current, events, outcome));
	}
}

export { DuelmonCombatTurn };

export default DuelmonCombatTurn;
