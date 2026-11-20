import { AttributeMap } from '@pocket-forge/attribute/domain';
import type { Combat } from '@pocket-forge/combat/domain';
import { CombatMother } from '@pocket-forge/combat/mother/domain';
import type { CombatCompletionHook, CombatRuleData } from '@pocket-forge/combat-engine/domain';
import { CombatOutcome, CombatRule } from '@pocket-forge/combat-engine/domain';
import { describe, expect, it } from 'bun:test';

const RULE_DATA: CombatRuleData = {
	attributes: AttributeMap.fromPrimitives({}),
	definitions: [],
};

class LastGroupRule extends CombatRule implements CombatCompletionHook {
	constructor() {
		super(RULE_DATA);
	}

	evaluateCompletion(combat: Combat): CombatOutcome | undefined {
		const last = combat.groups.at(-1);

		return last ? CombatOutcome.victory(last.id) : undefined;
	}
}

class DrawRule extends CombatRule implements CombatCompletionHook {
	constructor() {
		super(RULE_DATA);
	}

	evaluateCompletion(_combat: Combat): CombatOutcome {
		return CombatOutcome.draw();
	}
}

class NoOutcomeRule extends CombatRule implements CombatCompletionHook {
	constructor() {
		super(RULE_DATA);
	}

	evaluateCompletion(_combat: Combat): CombatOutcome | undefined {
		return undefined;
	}
}

describe('CombatCompletionHook', () => {
	it('returns a victory outcome for the last group', () => {
		const combat = CombatMother.create();
		const last = combat.groups.at(-1);

		if (!last) {
			throw new Error('Expected the combat to have a group');
		}

		expect(new LastGroupRule().evaluateCompletion(combat)).toEqual(CombatOutcome.victory(last.id));
	});

	it('returns a draw outcome', () => {
		expect(new DrawRule().evaluateCompletion(CombatMother.create())).toEqual(CombatOutcome.draw());
	});

	it('returns undefined while combat continues', () => {
		expect(new NoOutcomeRule().evaluateCompletion(CombatMother.create())).toBeUndefined();
	});
});
