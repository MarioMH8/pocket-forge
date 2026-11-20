import Either from '@hexadrop/either';
import type { CombatTransitionError } from '@pocket-forge/combat/domain';
import { Combat } from '@pocket-forge/combat/domain';

import CombatEngineError from './combat-engine.error';
import type { CombatOutcome } from './combat-outcome';
import CombatResolution from './combat-resolution/combat-resolution';
import type CombatResolutionError from './combat-resolution/combat-resolution.error';
import type CombatSetup from './combat-setup';
import type { CombatEvent } from './event/combat-event';
import CombatEvents from './event/combat-event';
import CombatRule from './rule/combat-rule';
import type CombatRuleError from './rule/combat-rule.error';

/**
 * Every rejection the Combat Engine can return.
 */
type CombatEngineFailure = CombatEngineError | CombatResolutionError | CombatRuleError | CombatTransitionError;

/**
 * Pure orchestrator that composes rules, an action resolver, and Move bindings
 * through an immutable {@link CombatSetup}.
 *
 * The engine validates each combat's composition, delegates action resolution
 * to the resolver, validates the proposed successor, evaluates every completion
 * hook, and returns a resolution. It performs no I/O, knows no concrete
 * implementation, and never mutates the input Combat.
 */
class CombatEngine {
	private readonly setup: CombatSetup;

	constructor(setup: CombatSetup) {
		this.setup = setup;
	}

	/**
	 * Compares two outcomes for agreement.
	 *
	 * @param left - First outcome.
	 * @param right - Second outcome.
	 * @returns Whether both outcomes describe the same result.
	 */
	private static isSameOutcome(left: CombatOutcome, right: CombatOutcome): boolean {
		if (left.status === 'draw' || right.status === 'draw') {
			return left.status === right.status;
		}

		return left.winnerGroupId === right.winnerGroupId;
	}

	private static nextSequence(events: readonly CombatEvent[]): number {
		return events.reduce((highest, event) => Math.max(highest, event.sequence), 0) + 1;
	}

	/**
	 * Resolves one action against a Combat.
	 *
	 * Rejections leave the input Combat and its RandomPocket untouched and
	 * produce no events. A completed resolution carries the successor snapshot,
	 * the ordered events, and the agreed outcome with its `combat-completed`
	 * event.
	 *
	 * @param combat - Active Combat snapshot to resolve.
	 * @param input - Resolver-owned input shape.
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

		const resolved = this.setup.actions.resolve({ combat, input, moveBindings: this.setup.moveBindings });

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
					'Action resolvers cannot complete Combat',
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

		const evaluated = this.evaluateCompletionHooks(successor);

		if (evaluated.isLeft()) {
			return Either.left(evaluated.getLeft());
		}

		const outcome = evaluated.getRight();

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
			return Either.right(CombatResolution.create(successor, transition.events));
		}

		const completed = successor.apply({
			groups: successor.groups,
			randomPocket: successor.randomPocket,
			status: 'completed',
		});

		if (completed.isLeft()) {
			return Either.left(completed.getLeft());
		}

		const completionEvent = CombatEvents.completed(outcome, CombatEngine.nextSequence(transition.events));

		return Either.right(
			CombatResolution.create(completed.getRight(), [...transition.events, completionEvent], outcome)
		);
	}

	/**
	 * Validates a Combat composition against every composition hook.
	 *
	 * @param combat - Combat snapshot to validate.
	 * @returns No value on success, or every rule rejection.
	 */
	validateComposition(combat: Combat): Either<CombatRuleError[], void> {
		const errors: CombatRuleError[] = [];

		for (const rule of this.setup.rules) {
			if (!CombatRule.isCompositionHook(rule)) {
				continue;
			}

			const validation = rule.validateComposition(combat.groups);

			if (validation.isLeft()) {
				errors.push(...validation.getLeft());
			}
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right();
	}

	/**
	 * Evaluates every completion hook and requires them to agree.
	 *
	 * @param combat - Combat snapshot to evaluate.
	 * @returns The agreed outcome, `undefined` when no rule completes, or a
	 * conflict rejection.
	 */
	private evaluateCompletionHooks(combat: Combat): Either<CombatEngineError[], CombatOutcome | undefined> {
		const outcomes: CombatOutcome[] = [];

		for (const rule of this.setup.rules) {
			if (!CombatRule.isCompletionHook(rule)) {
				continue;
			}

			const outcome = rule.evaluateCompletion(combat);

			if (outcome) {
				outcomes.push(outcome);
			}
		}

		const [first] = outcomes;

		if (!first) {
			return Either.right(undefined);
		}

		if (outcomes.some(outcome => !CombatEngine.isSameOutcome(first, outcome))) {
			return Either.left([
				new CombatEngineError(
					'conflicting-outcome',
					'Completion rules returned conflicting outcomes',
					'outcome'
				),
			]);
		}

		return Either.right(first);
	}
}

export type { CombatEngineFailure };
export default CombatEngine;
