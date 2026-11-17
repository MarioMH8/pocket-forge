import Either from '@hexadrop/either';

import Combat from '../combat';
import type CombatEvent from '../combat-event';
import type CombatResolutionError from '../combat-resolution.error';
import type CombatTransitionError from '../combat-transition.error';
import type CombatRulesetError from '../ruleset/combat-ruleset.error';
import CombatEngineError from './combat-engine.error';
import type CombatResolution from './combat-resolution';
import type CombatSetup from './combat-setup';

/**
 * Every rejection the Combat Engine can return.
 */
type CombatEngineFailure = CombatEngineError | CombatResolutionError | CombatRulesetError | CombatTransitionError;

/**
 * Pure orchestrator that composes a Combat Ruleset, an action plugin, an action
 * set, and a completion rule through a validated {@link CombatSetup}.
 *
 * The engine validates each combat's composition, delegates action resolution
 * to the setup's plugin, validates the proposed successor, evaluates the
 * setup's completion rule, and returns a resolution. It performs no I/O, knows
 * no concrete implementation, and never mutates the input Combat.
 */
class CombatEngine {
	private readonly setup: CombatSetup;

	constructor(setup: CombatSetup) {
		this.setup = setup;
	}

	private static nextSequence(events: readonly CombatEvent[]): number {
		return events.reduce((highest, event) => Math.max(highest, event.sequence), 0) + 1;
	}

	/**
	 * Resolves one action against a Combat.
	 *
	 * Rejections leave the input Combat and its RandomPocket untouched and
	 * produce no events. A completed resolution carries the successor snapshot,
	 * the ordered plugin events, and an optional completion outcome with its
	 * `combat-completed` event.
	 *
	 * @param combat - Active Combat snapshot to resolve.
	 * @param input - Plugin-owned input shape.
	 * @returns The resolution, or every rejection.
	 */
	resolve(combat: Combat, input: unknown): Either<CombatEngineFailure[], CombatResolution> {
		if (combat.status !== 'active') {
			return Either.left([
				new CombatEngineError('combat-not-active', 'Only active combats can be resolved', 'status'),
			]);
		}

		const composition = this.validateComposition(combat);

		if (composition.isLeft()) {
			return Either.left(composition.getLeft());
		}

		const resolved = this.setup.actions.resolve({ actionSet: this.setup.actionSet, combat, input });

		if (resolved.isLeft()) {
			return Either.left(resolved.getLeft());
		}

		const transition = resolved.getRight();
		const successor = transition.combat;

		if (successor.id !== combat.id) {
			return Either.left([
				new CombatEngineError(
					'invalid-transition',
					`Transition must preserve the combat id "${combat.id}"`,
					'transition.combat.id'
				),
			]);
		}

		if (successor.status !== 'active') {
			return Either.left([
				new CombatEngineError(
					'invalid-transition',
					'Action plugins cannot complete Combat',
					'transition.combat.status'
				),
			]);
		}

		const membership = Combat.validateComposition(successor.groups);

		if (membership.isLeft()) {
			return Either.left(membership.getLeft());
		}

		const successorComposition = this.validateComposition(successor);

		if (successorComposition.isLeft()) {
			return Either.left(successorComposition.getLeft());
		}

		const outcome = this.setup.completion.evaluate(successor);

		if (outcome?.status === 'victory' && successor.groups.every(group => group.id !== outcome.winnerGroupId)) {
			return Either.left([
				new CombatEngineError(
					'invalid-outcome',
					`Completion rule returned unknown winning group "${outcome.winnerGroupId}"`,
					'outcome.winnerGroupId'
				),
			]);
		}

		if (!outcome) {
			return Either.right({ combat: successor, events: transition.events, outcome: undefined });
		}

		const completed = successor.apply({
			groups: successor.groups,
			randomPocket: successor.randomPocket,
			status: 'completed',
		});

		if (completed.isLeft()) {
			return Either.left(completed.getLeft());
		}

		const completionEvent: CombatEvent = {
			payload:
				outcome.status === 'victory'
					? { status: 'victory', winnerGroupId: outcome.winnerGroupId }
					: { status: 'draw' },
			sequence: CombatEngine.nextSequence(transition.events),
			type: 'combat-completed',
		};

		return Either.right({
			combat: completed.getRight(),
			events: [...transition.events, completionEvent],
			outcome,
		});
	}

	/**
	 * Validates a Combat composition against the configured ruleset.
	 *
	 * @param combat - Combat snapshot to validate.
	 * @returns No value on success, or every ruleset rejection.
	 */
	validateComposition(combat: Combat): Either<CombatRulesetError[], void> {
		return this.setup.ruleset.validateGroups(combat.groups);
	}
}

export type { CombatEngineFailure };
export default CombatEngine;
