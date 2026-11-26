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
	'      - aqua-burst (Water / Special / 40 power)',
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

const ACTION = {
	actorId: 'player-emberling',
	moveId: 'ember-burst',
	speed: 70,
	targetId: 'opponent-aquafin',
	tieBreak: false,
};

function combatAfterHit(): Combat {
	const primitives = DuelmonCombatStartMother.primitives();
	const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

	if (!opponent) {
		throw new Error('Start fixture is missing the opponent combatant');
	}

	opponent.attributes['hp'] = 84;

	return Combat.fromPrimitives(primitives);
}

function actionEntry(): DuelmonCombatHistoryEntry {
	return DuelmonCombatHistoryEntry.action(combatAfterHit(), ACTION);
}

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

	it('records an action entry with its actor, Move, and target', () => {
		const entry = actionEntry();

		expect(entry.kind).toBe('action');
		expect(entry.action).toEqual(ACTION);
	});

	it('keeps the successor snapshot produced by the action', () => {
		const combat = combatAfterHit();

		expect(DuelmonCombatHistoryEntry.action(combat, ACTION).combat).toEqual(combat.toPrimitives());
	});

	it('identifies the action and explains its order in the readable text', () => {
		const combat = combatAfterHit();
		const entry = DuelmonCombatHistoryEntry.action(combat, ACTION);

		expect(entry.text.startsWith('player-emberling acted first with ember-burst on opponent-aquafin')).toBe(true);
		expect(entry.text).toContain('(Speed 70 > 48)');
		expect(entry.text).toContain(DuelmonCombatReport.fromCombat(combat).toString());
		expect(entry.text).toContain('opponent-aquafin (aquafin) [Water] HP 84/104');
	});

	it('keeps the action text consistent with its serialized snapshot', () => {
		const entry = actionEntry();
		const report = DuelmonCombatReport.fromCombat(Combat.fromPrimitives(entry.combat)).toString();

		expect(entry.text).toBe(
			`player-emberling acted first with ember-burst on opponent-aquafin (Speed 70 > 48)\n\n${report}`
		);
	});

	it('explains an equal-Speed tie with the fixed combat order', () => {
		const primitives = DuelmonCombatStartMother.primitives();
		const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

		if (!opponent) {
			throw new Error('Start fixture is missing the opponent combatant');
		}

		opponent.attributes['speed'] = 70;

		const entry = DuelmonCombatHistoryEntry.action(Combat.fromPrimitives(primitives), {
			...ACTION,
			tieBreak: true,
		});

		expect(entry.text.startsWith('player-emberling acted first with ember-burst on opponent-aquafin')).toBe(true);
		expect(entry.text).toContain('(Speed 70 = 70, fixed combat order)');
	});

	it('explains a slower action as acting second', () => {
		const primitives = DuelmonCombatStartMother.primitives();
		const opponent = primitives.groups.find(group => group.id === 'opponent')?.combatants[0];

		if (!opponent) {
			throw new Error('Start fixture is missing the opponent combatant');
		}

		const entry = DuelmonCombatHistoryEntry.action(Combat.fromPrimitives(primitives), {
			actorId: 'opponent-aquafin',
			moveId: 'aqua-burst',
			speed: 48,
			targetId: 'player-emberling',
			tieBreak: false,
		});

		expect(entry.text.startsWith('opponent-aquafin acted second with aqua-burst on player-emberling')).toBe(true);
		expect(entry.text).toContain('(Speed 48 < 70)');
	});

	it('round-trips action primitives', () => {
		const primitives = actionEntry().toPrimitives();

		expect(primitives.action).toEqual(ACTION);
		expect(DuelmonCombatHistoryEntry.fromPrimitives(primitives).toPrimitives()).toEqual(primitives);
	});

	it('does not share its action identifiers or snapshot with the caller', () => {
		const entry = actionEntry();
		const returnedAction = entry.action as { actorId: string };

		returnedAction.actorId = 'mutated';

		expect(entry.action?.actorId).toBe(ACTION.actorId);

		const primitives = entry.toPrimitives();
		const hydrated = DuelmonCombatHistoryEntry.fromPrimitives(primitives);

		(primitives.action as { actorId: string }).actorId = 'mutated-again';
		(primitives.combat as { id: string }).id = 'mutated-combat';

		expect(hydrated.action?.actorId).toBe(ACTION.actorId);
		expect(hydrated.combat.id).toBe('combat-1');
	});

	it('rejects an action entry without action identifiers', () => {
		const primitives = actionEntry().toPrimitives();

		expect(() =>
			DuelmonCombatHistoryEntry.fromPrimitives({
				combat: primitives.combat,
				kind: primitives.kind,
				text: primitives.text,
			})
		).toThrow();
	});

	it('rejects a start entry with action identifiers', () => {
		const primitives = entry().toPrimitives();

		expect(() => DuelmonCombatHistoryEntry.fromPrimitives({ ...primitives, action: ACTION })).toThrow();
	});
});
