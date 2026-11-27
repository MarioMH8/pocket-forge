import Either from '@hexadrop/either';
import type { AttributeDefinition, AttributeValues } from '@pocket-forge/attribute/domain';
import type {
	Combat,
	CombatantGroupPrimitives,
	CombatantPrimitives,
	CombatPrimitives,
} from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { DuelmonAttributeDefinitions } from '@pocket-forge/duelmon/catalog';
import type { MovePrimitives } from '@pocket-forge/move/domain';
import RandomPocket from '@pocket-forge/rng/domain';

import { Gen1BattleStats } from '../action/use-move/gen1/battle-stats';
import { DuelmonMove } from '../move/duelmon-move';
import { DuelmonSpecies } from '../species/duelmon-species';
import type { UnknownRecord } from '../support/duelmon-record';
import { DuelmonRecord } from '../support/duelmon-record';
import { DuelmonCombatStartError } from './duelmon-combat-start.error';
import type { DuelmonCombatStartCombatantRequest, DuelmonCombatStartRequest } from './duelmon-combat-start.request';
import { Phase1MoveConstraints } from './phase-1-move.constraints';

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

	/**
	 * Resolves authored content into a validated initial combat.
	 *
	 * Every referenced species and move is resolved through the catalog, move
	 * support is checked against the Phase 1 slice, and the Gen 1 battle
	 * attributes are derived before the state is validated. Content and state
	 * failures use the same error type; a failed start never returns a partial
	 * combat.
	 *
	 * @param request - Authored starting point: content references and seed.
	 * @param catalog - Duelmon catalog built from the private dataset.
	 * @param definitions - Definitions that govern combatant and group attributes.
	 * @returns The initial combat, or every content and state failure.
	 * @example
	 * ```ts
	 * const result = DuelmonCombatStart.fromContent(request, catalog, definitions);
	 * ```
	 */
	static fromContent(
		request: DuelmonCombatStartRequest,
		catalog: DuelmonCatalog,
		definitions: DuelmonCombatStartDefinitions
	): Either<DuelmonCombatStartError[], Combat> {
		const requestErrors = this.validateRequest(request);

		if (!DuelmonRecord.isRecord(request) || !Array.isArray(request.groups)) {
			return Either.left(requestErrors);
		}

		const errors: DuelmonCombatStartError[] = [...requestErrors];
		const groups: CombatantGroupPrimitives[] = [];

		for (const [groupIndex, rawGroup] of request.groups.entries()) {
			if (!DuelmonRecord.isRecord(rawGroup)) {
				continue;
			}

			const groupPath = `groups.${String(groupIndex)}`;
			const groupId = this.isNonEmptyString(rawGroup['id']) ? rawGroup['id'] : '';
			const activeCombatantIds = this.isStringArray(rawGroup[ACTIVE_COMBATANT_IDS])
				? [...rawGroup[ACTIVE_COMBATANT_IDS]]
				: [];
			const combatants = this.resolveGroupCombatants(rawGroup['combatants'], groupId, groupPath, catalog, errors);

			groups.push({
				attributes: { [ACTIVE_COMBATANT_IDS]: activeCombatantIds },
				combatants,
				id: groupId,
			});
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		const primitives: CombatPrimitives = {
			attributes: {},
			groups,
			id: request.id,
			randomPocket: RandomPocket.create(request.seed).toPrimitives(),
			status: 'active',
		};

		return this.create(primitives, definitions);
	}

	/**
	 * Narrows an unknown value to a non-empty string.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is a non-empty string.
	 */
	private static isNonEmptyString(value: unknown): value is string {
		return typeof value === 'string' && value.trim().length > 0;
	}

	/**
	 * Narrows an unknown value to a string array.
	 *
	 * @param value - Candidate value.
	 * @returns Whether the value is an array of strings.
	 */
	private static isStringArray(value: unknown): value is string[] {
		return Array.isArray(value) && value.every(item => typeof item === 'string');
	}

	private static resolveCombatant(
		request: DuelmonCombatStartCombatantRequest,
		groupId: string,
		path: string,
		catalog: DuelmonCatalog,
		errors: DuelmonCombatStartError[]
	): CombatantPrimitives | undefined {
		if (!this.isNonEmptyString(request.speciesId)) {
			return undefined;
		}

		const speciesId = request.speciesId;
		const species = catalog.findSpecies(speciesId);

		if (!species) {
			errors.push(
				new DuelmonCombatStartError(
					'unknown-species',
					`Unknown species "${speciesId}"`,
					`${path}.creature.species.id`
				)
			);
		}

		const moves: MovePrimitives[] = [];
		const moveIds: readonly unknown[] = Array.isArray(request.moveIds) ? request.moveIds : [];

		for (const [moveIndex, moveId] of moveIds.entries()) {
			if (!this.isNonEmptyString(moveId)) {
				continue;
			}

			const movePath = `${path}.creature.moves.${String(moveIndex)}`;
			const move = catalog.findMove(moveId);

			if (!move) {
				errors.push(new DuelmonCombatStartError('unknown-move', `Unknown move "${moveId}"`, movePath));

				continue;
			}

			const unsupported = Phase1MoveConstraints.unsupportedReason(DuelmonMove.fromMove(move));

			if (unsupported) {
				errors.push(new DuelmonCombatStartError('unsupported-move', unsupported, movePath));

				continue;
			}

			moves.push(move.toPrimitives());
		}

		if (!species) {
			return undefined;
		}

		const baseStats = DuelmonSpecies.fromSpecies(species).baseStats();

		return {
			attributes: { ...Gen1BattleStats.derive(baseStats, this.STARTING_LEVEL) },
			creature: {
				abilities: [],
				attributes: {},
				id: this.isNonEmptyString(request.creatureId) ? request.creatureId : '',
				moves,
				species: species.toPrimitives(),
			},
			groupId,
			id: this.isNonEmptyString(request.id) ? request.id : '',
		};
	}

	private static resolveGroupCombatants(
		combatantRequests: unknown,
		groupId: string,
		groupPath: string,
		catalog: DuelmonCatalog,
		errors: DuelmonCombatStartError[]
	): CombatantPrimitives[] {
		const combatants: CombatantPrimitives[] = [];

		if (!Array.isArray(combatantRequests)) {
			return combatants;
		}

		for (const [combatantIndex, rawCombatant] of combatantRequests.entries()) {
			if (!DuelmonRecord.isRecord(rawCombatant)) {
				continue;
			}

			const combatant = this.resolveCombatant(
				rawCombatant as unknown as DuelmonCombatStartCombatantRequest,
				groupId,
				`${groupPath}.combatants.${String(combatantIndex)}`,
				catalog,
				errors
			);

			if (combatant) {
				combatants.push(combatant);
			}
		}

		return combatants;
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

		if (!this.isNonEmptyString(primitives.id)) {
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

		this.validateCombatAttributes(primitives.attributes, errors);
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

		if (!this.isStringArray(activeIds) || activeIds.length !== 1) {
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

	private static validateCombatAttributes(attributes: unknown, errors: DuelmonCombatStartError[]): void {
		this.validateEmptyAttributes(attributes, 'attributes', 'Combat', errors);
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

		if (!this.isNonEmptyString(id)) {
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

		if (!this.isNonEmptyString(creature['id'])) {
			errors.push(new DuelmonCombatStartError('missing-id', 'Creature id is required', `${path}.id`));
		}

		this.validateEmptyAttributes(creature['attributes'], `${path}.attributes`, 'Creature', errors);

		const abilities = creature['abilities'];

		if (!Array.isArray(abilities)) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-combat',
					'Creature abilities must be an array',
					`${path}.abilities`
				)
			);
		} else if (abilities.length > 0) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-combat',
					'Phase 1 creatures cannot have abilities',
					`${path}.abilities`
				)
			);
		}

		const species = creature[SPECIES];
		const speciesPath = `${path}.${SPECIES}`;

		if (DuelmonRecord.isRecord(species)) {
			if (!this.isNonEmptyString(species['id'])) {
				errors.push(
					new DuelmonCombatStartError('missing-species', 'Species id is required', `${speciesPath}.id`)
				);
			}

			const speciesAttributes = species['attributes'];

			this.validateAttributes(
				speciesAttributes as AttributeValues,
				DuelmonAttributeDefinitions.SPECIES,
				`${speciesPath}.attributes`,
				errors,
				[TYPES]
			);
			this.validateTypes(speciesAttributes, `${speciesPath}.attributes`, errors);
		} else {
			errors.push(
				new DuelmonCombatStartError('missing-species', 'Combatant species is required', `${speciesPath}.id`)
			);
		}

		this.validateMoves(creature[MOVES], `${path}.${MOVES}`, errors);
	}

	private static validateEmptyAttributes(
		attributes: unknown,
		path: string,
		context: string,
		errors: DuelmonCombatStartError[]
	): void {
		if (!DuelmonRecord.isRecord(attributes)) {
			errors.push(
				new DuelmonCombatStartError('invalid-attribute', `${context} attributes must be an object`, path)
			);

			return;
		}

		for (const key of Object.keys(attributes)) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-attribute',
					`${context} attribute "${key}" is not part of Phase 1`,
					`${path}.${key}`
				)
			);
		}
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

		if (!this.isNonEmptyString(id)) {
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

			if (!DuelmonRecord.isRecord(move) || !this.isNonEmptyString(move['id'])) {
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

			const errorsBefore = errors.length;

			this.validateAttributes(
				move['attributes'] as AttributeValues,
				DuelmonAttributeDefinitions.MOVE,
				`${movePath}.attributes`,
				errors
			);

			if (errors.length > errorsBefore) {
				continue;
			}

			const unsupported = Phase1MoveConstraints.unsupportedReason(
				DuelmonMove.fromPrimitives(move as unknown as MovePrimitives)
			);

			if (unsupported) {
				errors.push(new DuelmonCombatStartError('unsupported-move', unsupported, movePath));
			}
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

	private static validateRequest(request: DuelmonCombatStartRequest): DuelmonCombatStartError[] {
		const errors: DuelmonCombatStartError[] = [];

		if (!DuelmonRecord.isRecord(request)) {
			errors.push(new DuelmonCombatStartError('invalid-request', 'Start request must be an object'));

			return errors;
		}

		if (!this.isNonEmptyString(request.id)) {
			errors.push(new DuelmonCombatStartError('invalid-request', 'Start request id is required', 'id'));
		}

		if (!Number.isSafeInteger(request.seed) || request.seed < 0) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-request',
					'Start request seed must be a non-negative integer',
					'seed'
				)
			);
		}

		const groups: unknown = request.groups;

		if (!Array.isArray(groups)) {
			errors.push(
				new DuelmonCombatStartError('invalid-request', 'Start request groups must be an array', 'groups')
			);

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
			const groupPath = `groups.${String(groupIndex)}`;

			if (!DuelmonRecord.isRecord(group)) {
				errors.push(new DuelmonCombatStartError('invalid-request', 'Group must be an object', groupPath));

				continue;
			}

			const groupId = group['id'];

			if (!this.isNonEmptyString(groupId)) {
				errors.push(new DuelmonCombatStartError('invalid-request', 'Group id is required', `${groupPath}.id`));
			} else if (groupIds.has(groupId)) {
				errors.push(
					new DuelmonCombatStartError('duplicate-id', `Duplicated group id: ${groupId}`, `${groupPath}.id`)
				);
			} else {
				groupIds.add(groupId);
			}

			const activeCombatantIds = group[ACTIVE_COMBATANT_IDS];

			if (!this.isStringArray(activeCombatantIds)) {
				errors.push(
					new DuelmonCombatStartError(
						'invalid-request',
						'Group activeCombatantIds must be an array of strings',
						`${groupPath}.attributes.${ACTIVE_COMBATANT_IDS}`
					)
				);
			} else if (activeCombatantIds.length !== 1) {
				errors.push(
					new DuelmonCombatStartError(
						'invalid-active-combatant',
						'Group requires exactly one active combatant id',
						`${groupPath}.attributes.${ACTIVE_COMBATANT_IDS}`
					)
				);
			}

			const combatants: unknown = group['combatants'];

			if (!Array.isArray(combatants)) {
				errors.push(
					new DuelmonCombatStartError(
						'invalid-request',
						'Group combatants must be an array',
						`${groupPath}.combatants`
					)
				);

				continue;
			}

			if (combatants.length !== 1) {
				errors.push(
					new DuelmonCombatStartError(
						'invalid-combatant-count',
						`Group "${String(groupId)}" requires exactly one combatant, received ${String(combatants.length)}`,
						`${groupPath}.combatants`
					)
				);
			}

			const groupCombatantIds = new Set<string>();

			for (const [combatantIndex, combatant] of combatants.entries()) {
				this.validateRequestCombatant(
					combatant,
					`${groupPath}.combatants.${String(combatantIndex)}`,
					groupCombatantIds,
					combatantIds,
					errors
				);
			}

			if (this.isStringArray(activeCombatantIds) && activeCombatantIds.length === 1) {
				const [activeId] = activeCombatantIds;

				if (activeId !== undefined && !groupCombatantIds.has(activeId)) {
					errors.push(
						new DuelmonCombatStartError(
							'invalid-active-combatant',
							`Active combatant "${activeId}" does not belong to group "${String(groupId)}"`,
							`${groupPath}.attributes.${ACTIVE_COMBATANT_IDS}`
						)
					);
				}
			}
		}

		return errors;
	}

	private static validateRequestCombatant(
		combatant: unknown,
		path: string,
		groupCombatantIds: Set<string>,
		combatantIds: Set<string>,
		errors: DuelmonCombatStartError[]
	): void {
		if (!DuelmonRecord.isRecord(combatant)) {
			errors.push(new DuelmonCombatStartError('invalid-request', 'Combatant must be an object', path));

			return;
		}

		for (const key of ['id', 'creatureId', 'speciesId'] as const) {
			if (!this.isNonEmptyString(combatant[key])) {
				errors.push(
					new DuelmonCombatStartError('invalid-request', `Combatant ${key} is required`, `${path}.${key}`)
				);
			}
		}

		const combatantId = combatant['id'];

		if (this.isNonEmptyString(combatantId)) {
			groupCombatantIds.add(combatantId);

			if (combatantIds.has(combatantId)) {
				errors.push(
					new DuelmonCombatStartError('duplicate-id', `Duplicated combatant id: ${combatantId}`, `${path}.id`)
				);
			} else {
				combatantIds.add(combatantId);
			}
		}

		const moveIds = combatant['moveIds'];

		if (!this.isStringArray(moveIds)) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-request',
					'Combatant moveIds must be an array of strings',
					`${path}.moveIds`
				)
			);

			return;
		}

		const movesPath = `${path}.creature.moves`;

		if (moveIds.length === 0) {
			errors.push(
				new DuelmonCombatStartError('missing-moves', 'Combatant requires at least one move', movesPath)
			);

			return;
		}

		if (moveIds.length > 4) {
			errors.push(
				new DuelmonCombatStartError(
					'invalid-moves',
					`Combatant allows at most four moves, received ${String(moveIds.length)}`,
					movesPath
				)
			);
		}

		const seenMoveIds = new Set<string>();

		for (const [moveIndex, moveId] of moveIds.entries()) {
			const movePath = `${movesPath}.${String(moveIndex)}`;

			if (!this.isNonEmptyString(moveId)) {
				errors.push(new DuelmonCombatStartError('invalid-moves', 'Move id is required', movePath));

				continue;
			}

			if (seenMoveIds.has(moveId)) {
				errors.push(new DuelmonCombatStartError('invalid-moves', `Duplicated move id: ${moveId}`, movePath));

				continue;
			}

			seenMoveIds.add(moveId);
		}
	}

	private static validateTypes(attributes: unknown, path: string, errors: DuelmonCombatStartError[]): void {
		const types = DuelmonRecord.isRecord(attributes) ? attributes[TYPES] : undefined;

		if (!this.isStringArray(types) || types.length === 0) {
			errors.push(
				new DuelmonCombatStartError('missing-types', 'Species requires at least one type', `${path}.${TYPES}`)
			);
		}
	}
}

export type { DuelmonCombatStartDefinitions };
export { DuelmonCombatStart };

export default DuelmonCombatStart;
