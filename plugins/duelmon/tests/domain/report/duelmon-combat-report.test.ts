import { DuelmonCombat, DuelmonCombatReport, DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const EXPECTED_LINES = [
	'Combat "combat-1"',
	'',
	'Group "player" (active: player-emberling)',
	'  * player-emberling (emberling) [Fire] HP 99/99',
	'      - ember-burst (Fire / Special / 40 power)',
	'      - tackle (Normal / Physical / 35 power)',
	'',
	'Group "opponent" (active: opponent-aquafin)',
	'  * opponent-aquafin (aquafin) [Water] HP 104/104',
	'      - aqua-burst (Water / Special / 40 power)',
	'      - tackle (Normal / Physical / 35 power)',
];

function report(): DuelmonCombatReport {
	return DuelmonCombatReport.fromCombat(DuelmonCombatStartMother.combat());
}

describe('DuelmonCombatReport', () => {
	it('renders the initial HP, active combatant, types, and moves', () => {
		expect(report().lines()).toEqual(EXPECTED_LINES);
	});

	it('joins the lines into a readable text', () => {
		expect(report().toString()).toBe(EXPECTED_LINES.join('\n'));
	});

	it('builds from an existing Duelmon Combat view', () => {
		const combat = DuelmonCombat.fromCombat(DuelmonCombatStartMother.combat());

		expect(DuelmonCombatReport.fromDuelmonCombat(combat).lines()).toEqual(EXPECTED_LINES);
	});

	it('does not render information outside Phase 1', () => {
		const text = report().toString();

		for (const excluded of [
			'PP',
			'accuracy',
			'priority',
			'status',
			'seed',
			'attack',
			'defense',
			'speed',
			'level',
		]) {
			expect(text).not.toContain(excluded);
		}

		for (const stat of ['48', '50', '57', '65', '70']) {
			expect(text).not.toContain(stat);
		}
	});

	it('is deterministic for the same combat state', () => {
		expect(report().lines()).toEqual(report().lines());
	});

	it('reads the same combat state that the start returns', () => {
		const started = DuelmonCombatStart.fromContent(
			DuelmonCombatStartMother.request(),
			DuelmonCombatStartMother.catalog(),
			DuelmonCombatStartMother.DEFINITIONS
		).getRight();

		expect(DuelmonCombatReport.fromCombat(started).lines()).toEqual(EXPECTED_LINES);
	});
});
