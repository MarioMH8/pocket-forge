import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';

import type { UnknownRecord } from '../support/duelmon-record';
import { DuelmonRecord } from '../support/duelmon-record';
import { DuelmonCombatStartError } from './duelmon-combat-start.error';

/**
 * Attribute definitions that govern the initial combat state.
 *
 * Definitions are scoped because combatants and groups carry different battle
 * attributes: `speed` belongs to a combatant, while `activeCombatantIds`
 * belongs to a group.
 */
interface DuelmonCombatStartDefinitions {
	/**
	 * Battle attributes required from every combatant.
	 */
	readonly combatant: readonly AttributeDefinition[];
	/**
	 * Battle attributes required from every combatant group.
	 */
	readonly group: readonly AttributeDefinition[];
}

const ACTIVE_COMBATANT_IDS = 'activeCombatantIds';
const HP = 'hp';
const MAX_HP = 'maxHp';
const MOVES = 'moves';
const SPECIES = 'species';
const TYPES = 'types';

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Builds a validated initial Combat from content or primitives.
 *
 * The start contract validates the complete snapshot before constructing any
 * `Combat`, `Combatant Group`, or `Combatant`. Every rejection is aggregated in
 * {@link DuelmonCombatStartError}, so a failed start never returns a partial
 * combat.
 */
class DuelmonCombatStart {
	/**
	 * Level assigned to every combatant in Phase 1.
	 *
	 * It is not a combat-level value: it is written to
	 * `combatant.attributes.level`. Phase 1 also fixes IVs and EVs at zero.
	 */
	static readonly STARTING_LEVEL = 50;

	/**
	 * Validates a complete initial state and hydrates it.
	 *
	 * @param primitives - Initial combat snapshot.
	 * @param definitions - Definitions that govern combatant and group attributes.
	 * @returns The initial combat, or every validation failure.
	 * @example
	 * ```ts
	 * const result = DuelmonCombatStart.create(primitives, DuelmonCombatStartMother.DEFINITIONS);
	 * ```
	 */
	static create(
		primitives: CombatPrimitives,
		definitions: DuelmonCombatStartDefinitions
	): Either<DuelmonCombatStartError[], Combat> {
		const errors = this.validate(primitives, definitions);

		return errors.length > 0 ? Either.left(errors) : Either.right(CombatEntity.fromPrimitives(primitives));
	}

	private static validate(
		primitives: CombatPrimitives,
		definitions: DuelmonCombatStartDefinitions
	): DuelmonCombatStartError[] {
		const errors: DuelmonCombatStartError[] = [];

		if (!DuelmonRecord.isRecord(primitives)) {
			errors.push(new DuelmonCombatStartError('invalid-combat', 'Combat primitives must be an object'));

			return errors;
		}

		if (!isNonEmptyString(primitives.id)) {
			errors.push(new DuelmonCombatStartError('invalid-combat', 'Combat id is required', 'id'));
		}

		if (primitives.status !== 'active') {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-combat',
					`Combat status must be "active", received "${primitives.status}"`,
					'status'
				)
			);
		}

		this.validateRandomPocket(primitives.randomPocket, errors);

		const groups = primitives.groups;

		if (!Array.isArray(groups)) {
			errors.push(new DuelmonCombatStartError('invalid-group-count', 'Combat groups must be an array', 'groups'));

			return errors;
		}

		if (groups.length !== 2) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-group-count',
					`Combat requires exactly two groups, received ${String(groups.length)}`,
					'groups'
				)
			);
		}

		const groupIds = new Set<string>();
		const combatantIds = new Set<string>();

		for (const [groupIndex, group] of groups.entries()) {
			this.validateGroup(group, `groups.${String(groupIndex)}`, definitions, groupIds, combatantIds, errors);
		}

		return errors;
	}

	private static validateActiveCombatants(
		group: UnknownRecord,
		path: string,
		errors: DuelmonCombatStartError[]
	): void {
		const attributes = group['attributes'];

		if (!DuelmonRecord.isRecord(attributes)) {
			return;
		}

		const activeIds = attributes[ACTIVE_COMBATANT_IDS];
		const activePath = `${path}.attributes.${ACTIVE_COMBATANT_IDS}`;

		if (!isStringArray(activeIds) || activeIds.length !== 1) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-active-combatant',
					'Group requires exactly one active combatant id',
					activePath
				)
			);

			return;
		}

		const combatants = group['combatants'];

		if (!Array.isArray(combatants)) {
			return;
		}

		const activeId = activeIds[0];

		if (combatants.every(combatant => !(DuelmonRecord.isRecord(combatant) && combatant['id'] === activeId))) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-active-combatant',
					`Active combatant "${String(activeId)}" does not belong to group "${String(group['id'])}"`,
					activePath
				)
			);
		}
	}

	private static validateAttributes(
		values: AttributeValues | undefined,
		definitions: readonly AttributeDefinition[],
		path: string,
		errors: DuelmonCombatStartError[],
		excludedKeys: readonly string[] = []
	): void {
		if (!DuelmonRecord.isRecord(values)) {
			errors.push(new DuelmonCombatStartError('invalid-attribute', 'Attributes must be an object', path));

			return;
		}

		const definedKeys = new Set(definitions.map(definition => definition.key));

		for (const definition of definitions) {
			if (excludedKeys.includes(definition.key)) {
				continue;
			}

			const raw = values[definition.key];
			const attributePath = `${path}.${definition.key}`;

			if (raw === undefined) {
				if (definition.required) {
					errors.push(
						new DuelmonCombatStartError(
							'missing-attribute',
							`Missing required attribute "${definition.key}"`,
							attributePath
						)
					);
				}

				continue;
			}

			const invalid = definition.validateValue(raw);

			if (invalid) {
				errors.push(new DuelmonCombatStartError('invalid-attribute', invalid.message, attributePath));
			}
		}

		for (const key of Object.keys(values)) {
			if (!definedKeys.has(key)) {
				errors.push(
					new DuelmonCombatStartError(
						'invalid-attribute',
						`No definition found for attribute "${key}"`,
						`${path}.${key}`
					)
				);
			}
		}
	}

	private static validateCombatant(
		combatant: unknown,
		group: UnknownRecord,
		path: string,
		definitions: DuelmonCombatStartDefinitions,
		combatantIds: Set<string>,
		errors: DuelmonCombatStartError[]
	): void {
		if (!DuelmonRecord.isRecord(combatant)) {
			errors.push(new DuelmonCombatStartError('invalid-combat', 'Combatant must be an object', path));

			return;
		}

		const id = combatant['id'];

		if (!isNonEmptyString(id)) {
			errors.push(new DuelmonCombatStartError('missing-id', 'Combatant id is required', `${path}.id`));
		} else if (combatantIds.has(id)) {
			errors.push(new DuelmonCombatStartError('duplicate-id', `Duplicated combatant id: ${id}`, `${path}.id`));
		} else {
			combatantIds.add(id);
		}

		const groupId = combatant['groupId'];

		if (groupId !== group['id']) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-membership',
					`Combatant "${String(id)}" groupId "${String(groupId)}" does not match group "${String(group['id'])}"`,
					`${path}.groupId`
				)
			);
		}

		this.validateAttributes(
			combatant['attributes'] as AttributeValues,
			definitions.combatant,
			`${path}.attributes`,
			errors
		);
		this.validateHp(combatant['attributes'], `${path}.attributes`, errors);
		this.validateCreature(combatant['creature'], `${path}.creature`, errors);
	}

	private static validateCreature(creature: unknown, path: string, errors: DuelmonCombatStartError[]): void {
		if (!DuelmonRecord.isRecord(creature)) {
			errors.push(
				new DuelmonCombatStartError(
					'missing-species',
					'Combatant creature must be an object',
					`${path}.${SPECIES}`
				),
				new DuelmonCombatStartError('missing-moves', 'Combatant moves must be an array', `${path}.${MOVES}`)
			);

			return;
		}

		const species = creature[SPECIES];
		const speciesPath = `${path}.${SPECIES}`;

		if (DuelmonRecord.isRecord(species)) {
			if (!isNonEmptyString(species['id'])) {
				errors.push(
					new DuelmonCombatStartError('missing-species', 'Species id is required', `${speciesPath}.id`)
				);
			}

			this.validateTypes(species['attributes'], `${speciesPath}.attributes`, errors);
		} else {
			errors.push(
				new DuelmonCombatStartError('missing-species', 'Combatant species is required', `${speciesPath}.id`)
			);
		}

		this.validateMoves(creature[MOVES], `${path}.${MOVES}`, errors);
	}

	private static validateGroup(
		group: unknown,
		path: string,
		definitions: DuelmonCombatStartDefinitions,
		groupIds: Set<string>,
		combatantIds: Set<string>,
		errors: DuelmonCombatStartError[]
	): void {
		if (!DuelmonRecord.isRecord(group)) {
			errors.push(new DuelmonCombatStartError('invalid-combat', 'Group must be an object', path));

			return;
		}

		const id = group['id'];

		if (!isNonEmptyString(id)) {
			errors.push(new DuelmonCombatStartError('missing-id', 'Group id is required', `${path}.id`));
		} else if (groupIds.has(id)) {
			errors.push(new DuelmonCombatStartError('duplicate-id', `Duplicated group id: ${id}`, `${path}.id`));
		} else {
			groupIds.add(id);
		}

		this.validateAttributes(
			group['attributes'] as AttributeValues,
			definitions.group,
			`${path}.attributes`,
			errors,
			[ACTIVE_COMBATANT_IDS]
		);
		this.validateActiveCombatants(group, path, errors);

		const combatants = group['combatants'];

		if (!Array.isArray(combatants)) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-combatant-count',
					`Group "${String(id)}" combatants must be an array`,
					`${path}.combatants`
				)
			);

			return;
		}

		if (combatants.length !== 1) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-combatant-count',
					`Group "${String(id)}" requires exactly one combatant, received ${String(combatants.length)}`,
					`${path}.combatants`
				)
			);
		}

		for (const [combatantIndex, combatant] of combatants.entries()) {
			this.validateCombatant(
				combatant,
				group,
				`${path}.combatants.${String(combatantIndex)}`,
				definitions,
				combatantIds,
				errors
			);
		}
	}

	private static validateHp(attributes: unknown, path: string, errors: DuelmonCombatStartError[]): void {
		if (!DuelmonRecord.isRecord(attributes)) {
			return;
		}

		const hp = attributes[HP];

		if (typeof hp !== 'number') {
			return;
		}

		const maxHp = attributes[MAX_HP];

		if (hp <= 0 || (typeof maxHp === 'number' && hp > maxHp)) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-hp',
					`Current hp ${String(hp)} must be positive and at most maxHp ${String(maxHp)}`,
					`${path}.${HP}`
				)
			);
		}
	}

	private static validateMoves(moves: unknown, path: string, errors: DuelmonCombatStartError[]): void {
		if (!Array.isArray(moves) || moves.length === 0) {
			errors.push(new DuelmonCombatStartError('missing-moves', 'Combatant requires at least one move', path));

			return;
		}

		if (moves.length > 4) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-moves',
					`Combatant allows at most four moves, received ${String(moves.length)}`,
					path
				)
			);
		}

		const moveIds = new Set<string>();

		for (const [moveIndex, move] of moves.entries()) {
			const movePath = `${path}.${String(moveIndex)}`;

			if (!DuelmonRecord.isRecord(move) || !isNonEmptyString(move['id'])) {
				errors.push(new DuelmonCombatStartError('invalid-moves', 'Move id is required', movePath));

				continue;
			}

			if (moveIds.has(move['id'])) {
				errors.push(
					new DuelmonCombatStartError('invalid-moves', `Duplicated move id: ${move['id']}`, movePath)
				);

				continue;
			}

			moveIds.add(move['id']);
		}
	}

	private static validateRandomPocket(randomPocket: unknown, errors: DuelmonCombatStartError[]): void {
		const isInvalid =
			!DuelmonRecord.isRecord(randomPocket) ||
			!Number.isSafeInteger(randomPocket['seed']) ||
			!Number.isSafeInteger(randomPocket['state']) ||
			(randomPocket['seed'] as number) < 0 ||
			(randomPocket['state'] as number) < 0;

		if (isInvalid) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-random-pocket',
					'Random state requires non-negative integer seed and state',
					'randomPocket'
				)
			);
		}
	}

	private static validateTypes(attributes: unknown, path: string, errors: DuelmonCombatStartError[]): void {
		const types = DuelmonRecord.isRecord(attributes) ? attributes[TYPES] : undefined;

		if (!isStringArray(types) || types.length === 0) {
			errors.push(
				new DuelmonCombatStartError('missing-types', 'Species requires at least one type', `${path}.${TYPES}`)
			);
		}
	}
}

export type { DuelmonCombatStartDefinitions };
export { DuelmonCombatStart };

export default DuelmonCombatStart;
