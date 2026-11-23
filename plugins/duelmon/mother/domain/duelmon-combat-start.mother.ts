import type { AttributeValues } from '@pocket-forge/attribute/domain';
import type { CombatantPrimitives, CombatPrimitives } from '@pocket-forge/combat/domain';
import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import type { DuelmonCombatStartDefinitions, DuelmonCombatStartRequest } from '@pocket-forge/duelmon/domain';
import { Gen1BattleStats, Phase1MoveConstraints } from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';

const EMBERLING_ATTRIBUTES: AttributeValues = {
	attack: 57,
	defense: 48,
	hp: 99,
	level: 50,
	maxHp: 99,
	special: 65,
	speed: 70,
};

const AQUAFIN_ATTRIBUTES: AttributeValues = {
	attack: 53,
	defense: 70,
	hp: 104,
	level: 50,
	maxHp: 104,
	special: 55,
	speed: 48,
};

/**
 * Object Mother for the initial combat start contract.
 *
 * The default starting point is a Phase 1 demo: emberling on the player side
 * and aquafin on the opponent side, both at level 50 with a fixed seed. The
 * expected primitives pin the derived Gen 1 battle stats while the embedded
 * species and move snapshots come from the dataset fixture catalog.
 */
export default class DuelmonCombatStartMother {
	/**
	 * Definitions that govern the initial combat state.
	 */
	static readonly DEFINITIONS: DuelmonCombatStartDefinitions = {
		combatant: [...Gen1BattleStats.DEFINITIONS],
		group: [...Gen1BattleStats.GROUP_DEFINITIONS],
	};

	private static catalogCache: DuelmonCatalog | undefined;
	private static constraintsCache: Phase1MoveConstraints | undefined;

	/**
	 * Returns the catalog built from the dataset fixture.
	 *
	 * @returns The validated Duelmon catalog.
	 */
	static catalog(): DuelmonCatalog {
		this.catalogCache ??= DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();

		return this.catalogCache;
	}

	/**
	 * Returns the Phase 1 move-support policy built from the dataset fixture.
	 *
	 * @returns The policy used by the start contract.
	 */
	static constraints(): Phase1MoveConstraints {
		this.constraintsCache ??= Phase1MoveConstraints.fromMoves(DuelmonDatasetMother.moves());

		return this.constraintsCache;
	}

	/**
	 * Builds one creature snapshot from catalog content.
	 *
	 * @param id - Creature instance identifier.
	 * @param speciesId - Species identifier from the dataset fixture.
	 * @param moveIds - Loadout move identifiers.
	 * @returns Creature primitives with embedded species and moves.
	 */
	static creature(id: string, speciesId: string, moveIds: readonly string[]): CombatantPrimitives['creature'] {
		const catalog = this.catalog();
		const species = catalog.findSpecies(speciesId);

		if (!species) {
			throw new Error(`Missing fixture species "${speciesId}"`);
		}

		const moves = moveIds.map(moveId => {
			const move = catalog.findMove(moveId);

			if (!move) {
				throw new Error(`Missing fixture move "${moveId}"`);
			}

			return move.toPrimitives();
		});

		return {
			abilities: [],
			attributes: {},
			id,
			moves,
			species: species.toPrimitives(),
		};
	}

	/**
	 * Builds the expected initial combat snapshot.
	 *
	 * @param overrides - Combat primitive fields to replace.
	 * @returns Initial combat primitives.
	 */
	static primitives(overrides: Partial<CombatPrimitives> = {}): CombatPrimitives {
		return {
			attributes: {},
			groups: [
				{
					attributes: { activeCombatantIds: ['player-emberling'] },
					combatants: [
						{
							attributes: { ...EMBERLING_ATTRIBUTES },
							creature: this.creature('emberling-1', 'emberling', ['ember-burst', 'tackle']),
							groupId: 'player',
							id: 'player-emberling',
						},
					],
					id: 'player',
				},
				{
					attributes: { activeCombatantIds: ['opponent-aquafin'] },
					combatants: [
						{
							attributes: { ...AQUAFIN_ATTRIBUTES },
							creature: this.creature('aquafin-1', 'aquafin', ['tackle']),
							groupId: 'opponent',
							id: 'opponent-aquafin',
						},
					],
					id: 'opponent',
				},
			],
			id: 'combat-1',
			randomPocket: { seed: 42, state: 42 },
			status: 'active',
			...overrides,
		};
	}

	/**
	 * Builds the Phase 1 demo start request.
	 *
	 * @param overrides - Start request fields to replace.
	 * @returns The authored starting point.
	 */
	static request(overrides: Partial<DuelmonCombatStartRequest> = {}): DuelmonCombatStartRequest {
		return {
			groups: [
				{
					activeCombatantIds: ['player-emberling'],
					combatants: [
						{
							creatureId: 'emberling-1',
							id: 'player-emberling',
							moveIds: ['ember-burst', 'tackle'],
							speciesId: 'emberling',
						},
					],
					id: 'player',
				},
				{
					activeCombatantIds: ['opponent-aquafin'],
					combatants: [
						{
							creatureId: 'aquafin-1',
							id: 'opponent-aquafin',
							moveIds: ['tackle'],
							speciesId: 'aquafin',
						},
					],
					id: 'opponent',
				},
			],
			id: 'combat-1',
			seed: 42,
			...overrides,
		};
	}
}
