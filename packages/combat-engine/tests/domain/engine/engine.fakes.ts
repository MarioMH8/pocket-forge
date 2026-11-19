import Either from '@hexadrop/either';
import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { Combat, CombatantGroup } from '@pocket-forge/combat/domain';
import type {
	CombatActionCatalog,
	CombatActionContext,
	CombatActionDescriptor,
	CombatActionPlugin,
	CombatActionSetPrimitives,
	CombatCompletionRule,
	CombatOutcome,
	CombatRulesetData,
	CombatRulesetError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import { CombatActionSet, CombatResolutionError, CombatRuleset } from '@pocket-forge/combat-engine/domain';

const GROUP_CONSTRAINTS = {
	maxCombatantsPerGroup: 6,
	maxGroups: 4,
	minCombatantsPerGroup: 1,
	minGroups: 1,
} as const;

const RULESET_DATA: CombatRulesetData = {
	attributes: AttributeMap.fromPrimitives({}),
	definitions: [],
	groupConstraints: GROUP_CONSTRAINTS,
};

const TACKLE: CombatActionDescriptor = {
	configDefinitions: [],
	id: 'tackle',
};

/**
 * Ruleset fake: a valid ruleset whose `validateGroups` can be swapped per test.
 */
class FakeCombatRuleset extends CombatRuleset {
	validateWith?: (groups: readonly CombatantGroup[]) => Either<CombatRulesetError[], void>;

	constructor() {
		super(RULESET_DATA);
	}

	override validateGroups(groups: readonly CombatantGroup[]): Either<CombatRulesetError[], void> {
		return this.validateWith?.(groups) ?? Either.right();
	}
}

class FakeActionCatalog implements CombatActionCatalog {
	find(actionId: string): CombatActionDescriptor | undefined {
		return actionId === TACKLE.id ? TACKLE : undefined;
	}
}

function actionSet(overrides?: Partial<CombatActionSetPrimitives>): CombatActionSet {
	return CombatActionSet.create(
		{
			bindings: [{ actionId: 'tackle', config: {}, moveId: 'move-1' }],
			...overrides,
		},
		new FakeActionCatalog()
	).getRight();
}

type ResolveBehavior = (context: CombatActionContext) => Either<CombatResolutionError[], CombatTransition>;

/**
 * Action plugin fake that records its context and replays a scripted behavior.
 */
class FakeActionPlugin implements CombatActionPlugin {
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

/**
 * Completion rule fake that returns a scripted outcome.
 */
class FakeCompletionRule implements CombatCompletionRule {
	readonly evaluated: Combat[] = [];
	outcome: CombatOutcome | undefined = undefined;

	evaluate(combat: Combat): CombatOutcome | undefined {
		this.evaluated.push(combat);

		return this.outcome;
	}
}

export { actionSet, FakeActionPlugin, FakeCombatRuleset, FakeCompletionRule };
