import type { Combat, CombatCompletionRule, CombatOutcome } from '@pocket-forge/combat/domain';
import { CombatMother } from '@pocket-forge/combat/mother/domain';
import { describe, expect, it } from 'bun:test';

class LastStandingRule implements CombatCompletionRule {
	evaluate(combat: Combat): CombatOutcome | undefined {
		const winner = combat.groups[0];

		if (!winner || combat.status !== 'completed') {
			return undefined;
		}

		return { status: 'victory', winnerGroupId: winner.id };
	}
}

class DrawRule implements CombatCompletionRule {
	evaluate(combat: Combat): CombatOutcome | undefined {
		return combat.status === 'completed' ? { status: 'draw' } : undefined;
	}
}

describe('CombatCompletionRule', () => {
	it('returns undefined while combat continues', () => {
		const rule = new LastStandingRule();

		expect(rule.evaluate(CombatMother.create())).toBeUndefined();
	});

	it('returns a victory outcome with the winning group', () => {
		const combat = CombatMother.create({ status: 'completed' });
		const winnerGroupId = combat.groups[0]?.id ?? '';
		const rule = new LastStandingRule();

		const outcome = rule.evaluate(combat);

		expect(outcome).toEqual({ status: 'victory', winnerGroupId });
	});

	it('returns a draw outcome', () => {
		const rule = new DrawRule();

		expect(rule.evaluate(CombatMother.create({ status: 'completed' }))).toEqual({ status: 'draw' });
	});
});
