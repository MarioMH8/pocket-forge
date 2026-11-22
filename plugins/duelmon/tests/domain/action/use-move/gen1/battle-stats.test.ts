import { Gen1BattleStats } from '@pocket-forge/duelmon/domain';
import { describe, expect, it } from 'bun:test';

const EMBERLING = {
	baseAtk: 52,
	baseDef: 43,
	baseHp: 39,
	baseSpecial: 60,
	baseSpeed: 65,
};

const AQUAFIN = {
	baseAtk: 48,
	baseDef: 65,
	baseHp: 44,
	baseSpecial: 50,
	baseSpeed: 43,
};

describe('Gen1BattleStats.derive', () => {
	it('derives level-50 stats with zero IVs and EVs', () => {
		expect(Gen1BattleStats.derive(EMBERLING, 50)).toEqual({
			attack: 57,
			defense: 48,
			hp: 99,
			level: 50,
			maxHp: 99,
			special: 65,
			speed: 70,
		});
		expect(Gen1BattleStats.derive(AQUAFIN, 50)).toEqual({
			attack: 53,
			defense: 70,
			hp: 104,
			level: 50,
			maxHp: 104,
			special: 55,
			speed: 48,
		});
	});

	it('follows the Gen 1 formula at other levels', () => {
		expect(Gen1BattleStats.derive(EMBERLING, 100)).toEqual({
			attack: 109,
			defense: 91,
			hp: 188,
			level: 100,
			maxHp: 188,
			special: 125,
			speed: 135,
		});
	});
});

describe('Gen1BattleStats definitions', () => {
	it('requires maxHp and speed in addition to the damage stats', () => {
		expect(Gen1BattleStats.DEFINITIONS.map(definition => definition.key)).toEqual([
			'level',
			'hp',
			'maxHp',
			'attack',
			'defense',
			'special',
			'speed',
		]);
		expect(Gen1BattleStats.DEFINITIONS.find(definition => definition.key === 'maxHp')?.required).toBe(true);
		expect(Gen1BattleStats.DEFINITIONS.find(definition => definition.key === 'speed')?.required).toBe(true);
	});

	it('declares the active combatant ids group attribute', () => {
		const [definition] = Gen1BattleStats.GROUP_DEFINITIONS;

		expect(definition?.key).toBe('activeCombatantIds');
		expect(definition?.required).toBe(true);
		expect(definition?.validateValue(['combatant-a'])).toBeUndefined();
		expect(definition?.validateValue(['combatant-a', 'combatant-b'])).toBeUndefined();
		expect(definition?.validateValue([])).toBeDefined();
		expect(definition?.validateValue(['a', 'b', 'c'])).toBeDefined();
		expect(definition?.validateValue('combatant-a')).toBeDefined();
	});
});
