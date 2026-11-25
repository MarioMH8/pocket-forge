import { Combat } from '@pocket-forge/combat/domain';
import { DuelmonCombatHistoryEntry, DuelmonCombatReport, DuelmonCombatStart } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const EXPECTED_TEXT = [
	'Combat "combat-1"',
	'',
	'Group "player" (active: player-emberling)',
	'  * player-emberling (emberling) [Fire] HP 99/99',
	'      - ember-burst (Fire / Special / 40 power)',
	'      - tackle (Normal / Physical / 35 power)',
	'',
	'Group "opponent" (active: opponent-aquafin)',
	'  * opponent-aquafin (aquafin) [Water] HP 104/104',
	'      - tackle (Normal / Physical / 35 power)',
].join('\n');

const EXCLUDED_DETAILS = [
	'PP',
	'accuracy',
	'priority',
	'status',
	'seed',
	'attack',
	'defense',
	'special',
	'speed',
	'level',
];

const EXCLUDED_VALUES = ['48', '50', '57', '65', '70'];

function entry(): DuelmonCombatHistoryEntry {
	return DuelmonCombatHistoryEntry.start(DuelmonCombatStartMother.combat());
}

describe('DuelmonCombatHistoryEntry', () => {
	it('records a start entry', () => {
		expect(entry().kind).toBe('start');
	});

	it('keeps the same combat snapshot the start returns', () => {
		const combat = DuelmonCombatStartMother.combat();

		expect(DuelmonCombatHistoryEntry.start(combat).combat).toEqual(combat.toPrimitives());
	});

	it('renders the same readable text as the combat report', () => {
		const combat = DuelmonCombatStartMother.combat();

		expect(DuelmonCombatHistoryEntry.start(combat).text).toBe(DuelmonCombatReport.fromCombat(combat).toString());
	});

	it('renders the active combatants, HP, types, and moves', () => {
		expect(entry().text).toBe(EXPECTED_TEXT);
	});

	it('does not expose information outside Phase 1', () => {
		const text = entry().text;

		for (const excluded of EXCLUDED_DETAILS) {
			expect(text).not.toContain(excluded);
		}

		for (const value of EXCLUDED_VALUES) {
			expect(text).not.toContain(value);
		}
	});

	it('keeps the readable text consistent with its serialized snapshot', () => {
		const entry = DuelmonCombatHistoryEntry.start(DuelmonCombatStartMother.combat());

		expect(DuelmonCombatReport.fromCombat(Combat.fromPrimitives(entry.combat)).toString()).toBe(entry.text);
	});

	it('round-trips through primitives', () => {
		const primitives = entry().toPrimitives();

		expect(DuelmonCombatHistoryEntry.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('does not share its snapshot with the caller', () => {
		const entry = DuelmonCombatHistoryEntry.start(DuelmonCombatStartMother.combat());
		const returned = entry.combat as { id: string };

		returned.id = 'mutated';

		expect(entry.combat.id).toBe('combat-1');

		const primitives = entry.toPrimitives();
		const hydrated = DuelmonCombatHistoryEntry.fromPrimitives(primitives);

		(primitives as { combat: { id: string } }).combat.id = 'mutated-again';

		expect(hydrated.combat.id).toBe('combat-1');
	});

	it('builds from the combat returned by the start contract', () => {
		const combat = DuelmonCombatStart.fromContent(
			DuelmonCombatStartMother.request(),
			DuelmonCombatStartMother.catalog(),
			DuelmonCombatStartMother.DEFINITIONS
		).getRight();

		const entry = DuelmonCombatHistoryEntry.start(combat);

		expect(entry.combat).toEqual(combat.toPrimitives());
		expect(entry.text).toBe(EXPECTED_TEXT);
	});
});
