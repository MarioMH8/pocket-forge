import type { Combat } from '@pocket-forge/combat/domain';

import { DuelmonCombat } from '../combat/duelmon-combat';

/**
 * Human-readable projection of a Combat for the minimal Phase 1 screen.
 *
 * The report reads the same Combat as battle resolution through the semantic
 * views. It keeps no manual copy of the state and only renders the information
 * Phase 1 exposes: active combatants, current and maximum HP, types, and moves.
 */
class DuelmonCombatReport {
	private readonly combat: DuelmonCombat;

	private constructor(combat: DuelmonCombat) {
		this.combat = combat;
	}

	/**
	 * Builds a report from a neutral Combat.
	 *
	 * @param combat - Combat already validated by the combat start.
	 * @returns The report.
	 */
	static fromCombat(combat: Combat): DuelmonCombatReport {
		return this.fromDuelmonCombat(DuelmonCombat.fromCombat(combat));
	}

	/**
	 * Builds a report from an existing Duelmon Combat view.
	 *
	 * @param combat - Semantic view over an already validated Combat.
	 * @returns The report.
	 */
	static fromDuelmonCombat(combat: DuelmonCombat): DuelmonCombatReport {
		return new DuelmonCombatReport(combat);
	}

	/**
	 * Readable lines that describe the combat state.
	 *
	 * @returns The report lines.
	 */
	lines(): readonly string[] {
		const lines: string[] = [`Combat "${this.combat.id}"`];

		for (const group of this.combat.groups()) {
			lines.push('', `Group "${group.id}" (active: ${group.activeCombatantIds.join(', ')})`);

			for (const combatant of group.activeCombatants()) {
				const species = combatant.species();

				lines.push(
					`  * ${combatant.id} (${species.id}) [${species.types.join(', ')}] ` +
						`HP ${String(combatant.hp)}/${String(combatant.maxHp)}`
				);

				for (const move of combatant.moves()) {
					lines.push(`      - ${move.id} (${move.type} / ${move.category} / ${String(move.power)} power)`);
				}
			}
		}

		return lines;
	}

	/**
	 * Readable text that describes the combat state.
	 *
	 * @returns The report lines joined by newlines.
	 */
	toString(): string {
		return this.lines().join('\n');
	}
}

export { DuelmonCombatReport };

export default DuelmonCombatReport;
