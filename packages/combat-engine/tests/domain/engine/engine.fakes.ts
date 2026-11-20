import Either from '@hexadrop/either';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { Combat, CombatantGroup } from '@pocket-forge/combat/domain';
import type {
	CombatActionCatalog,
	CombatActionContext,
	CombatActionDescriptor,
	CombatActionResolver,
	CombatCompletionHook,
	CombatMoveBindingSetPrimitives,
	CombatOutcome,
	CombatRuleData,
	CombatRuleError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import { CombatMoveBindingSet, CombatResolutionError, CombatRule } from '@pocket-forge/combat-engine/domain';
import { CombatCompositionRule } from '@pocket-forge/combat-engine/rules';

const GROUP_CONSTRAINTS = {
	maxCombatantsPerGroup: 6,
	maxGroups: 4,
	minCombatantsPerGroup: 1,
	minGroups: 1,
} as const;

const RULE_DATA: CombatRuleData = {
	attributes: AttributeMap.fromPrimitives({}),
	definitions: [],
};

const TACKLE: CombatActionDescriptor = {
	configDefinitions: [],
	id: 'tackle',
};

/**
 * Composition rule fake whose `validateComposition` can be swapped per test.
 */
class FakeCompositionRule extends CombatCompositionRule {
	validateWith?: (groups: readonly CombatantGroup[]) => Either<CombatRuleError[], void>;

	constructor() {
		super(RULE_DATA, GROUP_CONSTRAINTS);
	}

	override validateComposition(groups: readonly CombatantGroup[]): Either<CombatRuleError[], void> {
		return this.validateWith?.(groups) ?? super.validateComposition(groups);
	}
}

/**
 * Completion rule fake that records evaluated combats and returns a scripted
 * outcome.
 */
class FakeCompletionRule extends CombatRule implements CombatCompletionHook {
	readonly evaluated: Combat[] = [];
	outcome: CombatOutcome | undefined = undefined;

	constructor() {
		super(RULE_DATA);
	}

	evaluate(combat: Combat): CombatOutcome | undefined {
		this.evaluated.push(combat);

		return this.outcome;
	}
}

class FakeActionCatalog implements CombatActionCatalog {
	find(actionId: string): CombatActionDescriptor | undefined {
		return actionId === TACKLE.id ? TACKLE : undefined;
	}
}

function moveBindings(overrides?: Partial<CombatMoveBindingSetPrimitives>): CombatMoveBindingSet {
	return CombatMoveBindingSet.create(
		{
			bindings: [{ actionId: 'tackle', config: {}, moveId: 'move-1' }],
			...overrides,
		},
		new FakeActionCatalog()
	).getRight();
}

type ResolveBehavior = (context: CombatActionContext) => Either<CombatResolutionError[], CombatTransition>;

/**
 * Action resolver fake that records its context and replays a scripted behavior.
 */
class FakeActionResolver implements CombatActionResolver {
	readonly actions: CombatActionCatalog = new FakeActionCatalog();
	readonly contexts: CombatActionContext[] = [];
	resolveWith?: ResolveBehavior;

	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		this.contexts.push(context);

		return (
			this.resolveWith?.(context) ??
			Either.left([new CombatResolutionError('rejected', 'No resolve behavior configured', 'input')])
		);
	}
}

export { FakeActionResolver, FakeCompletionRule, FakeCompositionRule, moveBindings };
