import Either from '@hexadrop/either';
import type { AttributeRecord, AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type {
	CombatActionContext,
	CombatActionResolver,
	CombatEngine,
	CombatEngineFailure,
	CombatResolution,
	CombatResolutionError,
	CombatRule,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import {
	CombatEngine as CombatEngineEntity,
	CombatOutcome,
	CombatResolution as CombatResolutionEntity,
	CombatSetup,
	CombatTransition as CombatTransitionEntity,
} from '@pocket-forge/combat-engine/domain';
import type { DuelmonCombatant } from '@pocket-forge/duelmon/domain';
import { DuelmonCombat, DuelmonCombatInput, DuelmonCombatTurn, DuelmonFailure } from '@pocket-forge/duelmon/domain';
import { DuelmonCombatMother, DuelmonCombatStartMother } from '@pocket-forge/duelmon/mother/domain';
import { describe, expect, it } from 'bun:test';

const CATALOG = DuelmonCombatStartMother.catalog();
const PLAYER = 'player-emberling';
const OPPONENT = 'opponent-aquafin';
const PLAYER_MOVE = 'ember-burst';
const OPPONENT_MOVE = 'aqua-burst';

interface StubCall {
	readonly actorId: string;
	readonly combat: Combat;
	readonly moveId: string;
	readonly targetId: string;
}

interface StubOptions {
	readonly damage?: Readonly<Record<string, number>>;
	readonly rejectedMoveIds?: readonly string[];
}

interface CombatOverrides {
	readonly opponentHp?: number;
	readonly opponentSpeed?: number;
	readonly playerFirst?: boolean;
	readonly playerHp?: number;
	readonly playerSpeed?: number;
}

class CombatTurnFixture {
	static activeCombatant(combatState: Combat, id: string): DuelmonCombatant {
		const found = DuelmonCombat.fromCombat(combatState)
			.groups()
			.flatMap(group => group.combatants())
			.find(combatant => combatant.id === id);

		if (!found) {
			throw new Error(`Missing combatant "${id}"`);
		}

		return found;
	}

	static combat(overrides: CombatOverrides = {}): Combat {
		const primitives: CombatPrimitives = DuelmonCombatStartMother.primitives();
		const player = primitives.groups.find(group => group.id === 'player');
		const opponent = primitives.groups.find(group => group.id === 'opponent');
		const playerCombatant = player?.combatants[0];
		const opponentCombatant = opponent?.combatants[0];

		if (!playerCombatant || !opponentCombatant) {
			throw new Error('Start fixture is missing a combatant');
		}

		if (overrides.playerSpeed !== undefined) {
			playerCombatant.attributes['speed'] = overrides.playerSpeed;
		}

		if (overrides.opponentSpeed !== undefined) {
			opponentCombatant.attributes['speed'] = overrides.opponentSpeed;
		}

		if (overrides.playerHp !== undefined) {
			playerCombatant.attributes['hp'] = overrides.playerHp;
		}

		if (overrides.opponentHp !== undefined) {
			opponentCombatant.attributes['hp'] = overrides.opponentHp;
		}

		if (overrides.playerFirst === false) {
			primitives.groups.reverse();
		}

		return CombatEntity.fromPrimitives(primitives);
	}

	static combatWithKnownMoves(combatantId: string, moveIds: readonly string[]): Combat {
		const primitives: CombatPrimitives = DuelmonCombatStartMother.primitives();
		const moves = moveIds.map(moveId => {
			const move = CATALOG.findMove(moveId);

			if (!move) {
				throw new Error(`Fixture is missing the move "${moveId}"`);
			}

			return move.toPrimitives();
		});

		return CombatEntity.fromPrimitives({
			...primitives,
			groups: primitives.groups.map(group => ({
				...group,
				combatants: group.combatants.map(combatant =>
					combatant.id === combatantId
						? {
								...combatant,
								creature: { ...combatant.creature, moves: [...combatant.creature.moves, ...moves] },
							}
						: combatant
				),
			})),
		});
	}

	static completed(state: Combat): Combat {
		return CombatEntity.fromPrimitives({ ...state.toPrimitives(), status: 'completed' });
	}

	/**
	 * Reduces the current PP of the Move used by the acting combatant.
	 *
	 * @param attributes - Acting combatant attributes.
	 * @param moveId - Move being resolved.
	 * @returns The attributes with the Move PP decreased.
	 */
	static consumeMovePp(attributes: AttributeValues, moveId: string): AttributeValues {
		const movePp = attributes['movePp'];

		if (!this.isAttributeRecordArray(movePp)) {
			return attributes;
		}

		return {
			...attributes,
			movePp: movePp.map(entry =>
				entry['moveId'] === moveId && typeof entry['current'] === 'number'
					? { ...entry, current: Math.max(0, entry['current'] - 1) }
					: entry
			),
		};
	}

	static declaration(actorId: string, moveId: string, targetId: string) {
		return {
			actorId,
			moveId,
			target: { id: targetId, scope: 'combatant' as const },
		};
	}

	static declarations() {
		return [this.declaration(PLAYER, PLAYER_MOVE, OPPONENT), this.declaration(OPPONENT, OPPONENT_MOVE, PLAYER)];
	}

	static engineWith(
		resolver: StubResolver,
		moveIds: readonly string[] = [PLAYER_MOVE, OPPONENT_MOVE],
		rules: readonly CombatRule[] = []
	): CombatEngine {
		const actionBindings = DuelmonCombatMother.useMoveBindings(moveIds);

		return new CombatEngineEntity(
			CombatSetup.create({
				actionBindings,
				actions: resolver,
				rules,
			})
		);
	}

	static movePpCurrent(state: Combat, combatantId: string, moveId: string): number | undefined {
		const combatant = state
			.toPrimitives()
			.groups.flatMap(group => group.combatants)
			.find(candidate => candidate.id === combatantId);
		const movePp = combatant?.attributes['movePp'];

		if (!this.isAttributeRecordArray(movePp)) {
			return undefined;
		}

		const current = movePp.find(entry => entry['moveId'] === moveId)?.['current'];

		return typeof current === 'number' ? current : undefined;
	}

	static moveUsedPairs(events: readonly { payload: Record<string, unknown>; type: string }[]): readonly string[] {
		return events
			.filter(event => event.type === 'move-used')
			.map(event => `${String(event.payload['attackerId'])}:${String(event.payload['moveId'])}`);
	}

	static turnWith(
		resolver: StubResolver,
		moveIds: readonly string[] = [PLAYER_MOVE, OPPONENT_MOVE],
		rules: readonly CombatRule[] = []
	): DuelmonCombatTurn {
		return new DuelmonCombatTurn(CATALOG, this.engineWith(resolver, moveIds, rules));
	}

	static withMovePp(state: Combat, entries: Readonly<Record<string, readonly AttributeRecord[]>>): Combat {
		const primitives = state.toPrimitives();

		return CombatEntity.fromPrimitives({
			...primitives,
			groups: primitives.groups.map(group => ({
				...group,
				combatants: group.combatants.map(combatant => {
					const movePp = entries[combatant.id];

					if (!movePp) {
						return combatant;
					}

					return {
						...combatant,
						attributes: { ...combatant.attributes, movePp: [...movePp] },
					};
				}),
			})),
		});
	}

	private static isAttributeRecord(value: AttributeValue | undefined): value is AttributeRecord {
		return typeof value === 'object' && !Array.isArray(value);
	}

	private static isAttributeRecordArray(value: AttributeValue | undefined): value is AttributeRecord[] {
		return Array.isArray(value) && value.every(entry => this.isAttributeRecord(entry));
	}
}

/**
 * Resolver stub that records every call and applies a fixed HP reduction.
 *
 * It isolates the turn service from the real Move mechanics: the service owns
 * ordering, event merging, and state threading, while the stub makes the calls
 * and their combat snapshots observable. It also decreases the `movePp` of the
 * acting Move when the snapshot carries that battle attribute, so a test can
 * prove that an omitted declaration never pays its cost.
 */
class StubResolver implements CombatActionResolver {
	readonly actions = DuelmonCombatMother.plugin().actions;
	readonly calls: StubCall[] = [];
	private readonly damage: Readonly<Record<string, number>>;
	private readonly rejectedMoveIds: ReadonlySet<string>;

	constructor(options: StubOptions = {}) {
		this.damage = options.damage ?? {};
		this.rejectedMoveIds = new Set(options.rejectedMoveIds);
	}

	resolve(context: CombatActionContext): Either<CombatResolutionError[], CombatTransition> {
		const parsed = DuelmonCombatInput.parse(context.input);

		if (parsed.isLeft()) {
			return Either.left(parsed.getLeft());
		}

		const input = parsed.getRight();
		const targetId = input.target.id;

		if (!targetId) {
			return DuelmonFailure.fail('invalid-target', 'Missing target id', 'input.target.id');
		}

		this.calls.push({
			actorId: input.actorId,
			combat: context.combat,
			moveId: input.moveId,
			targetId,
		});

		if (this.rejectedMoveIds.has(input.moveId)) {
			return DuelmonFailure.fail('rejected', `Stub rejected Move "${input.moveId}"`, 'input.moveId');
		}

		const damage = this.damage[input.moveId] ?? 0;
		const base = context.combat.toPrimitives();
		const primitives: CombatPrimitives = {
			...base,
			groups: base.groups.map(group => ({
				...group,
				combatants: group.combatants.map(combatant => {
					const withMovePp =
						combatant.id === input.actorId
							? {
									...combatant,
									attributes: CombatTurnFixture.consumeMovePp(combatant.attributes, input.moveId),
								}
							: combatant;

					if (withMovePp.id !== targetId) {
						return withMovePp;
					}

					return {
						...withMovePp,
						attributes: {
							...withMovePp.attributes,
							hp: Math.max(0, Number(withMovePp.attributes['hp']) - damage),
						},
					};
				}),
			})),
		};

		const successor = CombatEntity.fromPrimitives(primitives);

		return Either.right(
			CombatTransitionEntity.create(successor, [
				{
					payload: {
						actionId: 'useMove',
						attackerId: input.actorId,
						damage,
						moveId: input.moveId,
						targetId,
					},
					sequence: 1,
					type: 'move-used',
				},
				{
					payload: {
						actionId: 'useMove',
						attributeKey: 'hp',
						operation: 'set',
						scope: 'combatant',
						targetId,
					},
					sequence: 2,
					type: 'attribute-modified',
				},
			])
		);
	}
}

/**
 * Engine double that returns a resolution the real engine cannot produce.
 *
 * It exercises the turn service's invariant guards without pretending a real
 * completion rule failed: one case completes the combat without an outcome, the
 * other returns an outcome while the combat is still active.
 */
class InconsistentEngine extends CombatEngineEntity {
	private readonly outcome: CombatOutcome | undefined;
	private readonly successor: Combat;

	constructor(successor: Combat, outcome?: CombatOutcome) {
		super(
			CombatSetup.create({
				actionBindings: DuelmonCombatMother.useMoveBindings([PLAYER_MOVE, OPPONENT_MOVE]),
				actions: DuelmonCombatMother.plugin(),
				rules: [],
			})
		);
		this.successor = successor;
		this.outcome = outcome;
	}

	override resolve(): Either<CombatEngineFailure[], CombatResolution> {
		return Either.right(CombatResolutionEntity.create(this.successor, [], this.outcome));
	}
}

describe('DuelmonCombatTurn', () => {
	it('resolves the fastest declared actor first and the slower one afterwards', () => {
		const resolver = new StubResolver({ damage: { [OPPONENT_MOVE]: 5, [PLAYER_MOVE]: 10 } });
		const result = CombatTurnFixture.turnWith(resolver).resolve(
			CombatTurnFixture.combat(),
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.actorId)).toEqual([PLAYER, OPPONENT]);
	});

	it('threads the successor combat of each action into the next action', () => {
		const resolver = new StubResolver({ damage: { [OPPONENT_MOVE]: 5, [PLAYER_MOVE]: 10 } });
		const result = CombatTurnFixture.turnWith(resolver).resolve(
			CombatTurnFixture.combat(),
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		const secondCall = resolver.calls[1];

		expect(secondCall).toBeDefined();

		if (!secondCall) {
			return;
		}

		expect(CombatTurnFixture.activeCombatant(secondCall.combat, OPPONENT).hp).toBe(94);
		expect(CombatTurnFixture.activeCombatant(secondCall.combat, PLAYER).hp).toBe(99);

		const resolution = result.getRight().resolution;

		expect(CombatTurnFixture.activeCombatant(resolution.combat, OPPONENT).hp).toBe(94);
		expect(CombatTurnFixture.activeCombatant(resolution.combat, PLAYER).hp).toBe(94);
	});

	it('skips an actor that is no longer standing when its action comes up', () => {
		const resolver = new StubResolver({ damage: { [PLAYER_MOVE]: 10 } });
		const result = CombatTurnFixture.turnWith(resolver).resolve(
			CombatTurnFixture.combat({ opponentHp: 5 }),
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.actorId)).toEqual([PLAYER]);

		const resolution = result.getRight().resolution;

		expect(CombatTurnFixture.activeCombatant(resolution.combat, OPPONENT).isFainted).toBe(true);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
	});

	it('stops the turn after the first action completes the combat', () => {
		const rules: readonly CombatRule[] = [DuelmonCombatMother.hpCompletionRule()];
		const resolver = new StubResolver({ damage: { [PLAYER_MOVE]: 10 } });
		const combatState = CombatTurnFixture.withMovePp(CombatTurnFixture.combat({ opponentHp: 5 }), {
			[OPPONENT]: [{ current: 20, max: 20, moveId: OPPONENT_MOVE }],
			[PLAYER]: [{ current: 20, max: 20, moveId: PLAYER_MOVE }],
		});
		const first = CombatTurnFixture.engineWith(
			new StubResolver({ damage: { [PLAYER_MOVE]: 10 } }),
			[PLAYER_MOVE, OPPONENT_MOVE],
			rules
		)
			.resolve(combatState, CombatTurnFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT))
			.getRight();
		const result = CombatTurnFixture.turnWith(resolver, [PLAYER_MOVE, OPPONENT_MOVE], rules).resolve(
			combatState,
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);

		if (result.isLeft()) {
			return;
		}

		const resolution = result.getRight().resolution;

		expect(resolver.calls.map(call => call.actorId)).toEqual([PLAYER]);
		expect(resolution.combat.status).toBe('completed');
		expect(resolution.combat.toPrimitives()).toEqual(first.combat.toPrimitives());
		expect(resolution.outcome).toEqual(CombatOutcome.victory('player'));
		expect(resolution.outcome?.isVictory() ? resolution.outcome.winnerGroupId : undefined).toBe('player');
		expect(CombatTurnFixture.activeCombatant(resolution.combat, OPPONENT).isFainted).toBe(true);
		expect(CombatTurnFixture.activeCombatant(resolution.combat, PLAYER).hp).toBe(99);
		expect(CombatTurnFixture.movePpCurrent(resolution.combat, PLAYER, PLAYER_MOVE)).toBe(19);
		expect(CombatTurnFixture.movePpCurrent(resolution.combat, OPPONENT, OPPONENT_MOVE)).toBe(20);
		expect(resolution.events.map(event => event.type)).toEqual([
			'move-used',
			'attribute-modified',
			'combat-completed',
		]);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2, 3]);
		expect(CombatTurnFixture.moveUsedPairs(resolution.events)).toEqual([`${PLAYER}:${PLAYER_MOVE}`]);
		expect(resolution.events.some(event => event.payload['attackerId'] === OPPONENT)).toBe(false);
	});

	it('rejects a turn over a combat that already completed without resolving anything', () => {
		const resolver = new StubResolver({ damage: { [PLAYER_MOVE]: 10 } });
		const combatState = CombatTurnFixture.completed(CombatTurnFixture.combat());
		const before = combatState.toPrimitives();
		const result = CombatTurnFixture.turnWith(resolver).resolve(combatState, CombatTurnFixture.declarations());

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
		expect(resolver.calls).toHaveLength(0);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('does not validate declarations after the combat completed', () => {
		const resolver = new StubResolver();
		const result = CombatTurnFixture.turnWith(resolver).resolve(
			CombatTurnFixture.completed(CombatTurnFixture.combat()),
			undefined
		);

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('combat-not-active');
		expect(resolver.calls).toHaveLength(0);
	});

	it('rejects a completed combat that the engine returned without an outcome', () => {
		const combatState = CombatTurnFixture.combat();
		const result = new DuelmonCombatTurn(
			CATALOG,
			new InconsistentEngine(CombatTurnFixture.completed(combatState))
		).resolve(combatState, CombatTurnFixture.declarations());

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('invalid-outcome');
	});

	it('rejects an engine outcome that did not complete the combat', () => {
		const combatState = CombatTurnFixture.combat();
		const result = new DuelmonCombatTurn(
			CATALOG,
			new InconsistentEngine(combatState, CombatOutcome.victory('player'))
		).resolve(combatState, CombatTurnFixture.declarations());

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('invalid-outcome');
	});

	it('resolves exactly the Move declared by each side and no other action', () => {
		const resolver = new StubResolver();
		const result = CombatTurnFixture.turnWith(resolver, [PLAYER_MOVE, OPPONENT_MOVE, 'tackle']).resolve(
			CombatTurnFixture.combat(),
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.moveId)).toEqual([PLAYER_MOVE, OPPONENT_MOVE]);
		expect(CombatTurnFixture.moveUsedPairs(result.getRight().resolution.events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('merges and renumbers the events of every action continuously', () => {
		const resolver = new StubResolver();
		const result = CombatTurnFixture.turnWith(resolver).resolve(
			CombatTurnFixture.combat(),
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(result.getRight().resolution.events.map(event => event.sequence)).toEqual([1, 2, 3, 4]);
	});

	it('breaks equal speeds by the fixed combat order', () => {
		const first = new StubResolver();
		const firstResult = CombatTurnFixture.turnWith(first).resolve(
			CombatTurnFixture.combat({ opponentSpeed: 70 }),
			CombatTurnFixture.declarations()
		);

		expect(firstResult.isRight()).toBe(true);
		expect(first.calls.map(call => call.actorId)).toEqual([PLAYER, OPPONENT]);

		const reversed = new StubResolver();
		const reversedResult = CombatTurnFixture.turnWith(reversed).resolve(
			CombatTurnFixture.combat({ opponentSpeed: 70, playerFirst: false }),
			CombatTurnFixture.declarations()
		);

		expect(reversedResult.isRight()).toBe(true);
		expect(reversed.calls.map(call => call.actorId)).toEqual([OPPONENT, PLAYER]);
	});

	it('exposes the Speed read from the ordered state and whether a tie was broken', () => {
		const different = CombatTurnFixture.turnWith(new StubResolver()).resolve(
			CombatTurnFixture.combat(),
			CombatTurnFixture.declarations()
		);
		const tied = CombatTurnFixture.turnWith(new StubResolver()).resolve(
			CombatTurnFixture.combat({ opponentSpeed: 70 }),
			CombatTurnFixture.declarations()
		);

		expect(different.isRight()).toBe(true);
		expect(tied.isRight()).toBe(true);

		if (different.isLeft() || tied.isLeft()) {
			return;
		}

		expect(different.getRight().actions.map(action => [action.actorId, action.speed, action.tieBreak])).toEqual([
			[PLAYER, 70, false],
			[OPPONENT, 48, false],
		]);
		expect(tied.getRight().actions.map(action => [action.actorId, action.speed, action.tieBreak])).toEqual([
			[PLAYER, 70, true],
			[OPPONENT, 70, true],
		]);
	});

	it('rejects a Status or non-zero priority Move at the turn boundary', () => {
		for (const [moveId, message] of [
			['oath', 'Move "oath" is a Status move, which is outside Phase 1'],
			['quick-jab', 'Move "quick-jab" has non-zero priority, which is outside Phase 1'],
		] as const) {
			const resolver = new StubResolver();
			const result = CombatTurnFixture.turnWith(resolver, [PLAYER_MOVE, OPPONENT_MOVE, moveId]).resolve(
				CombatTurnFixture.combatWithKnownMoves(PLAYER, [moveId]),
				[
					CombatTurnFixture.declaration(PLAYER, moveId, OPPONENT),
					CombatTurnFixture.declaration(OPPONENT, OPPONENT_MOVE, PLAYER),
				]
			);

			expect(result.isLeft()).toBe(true);

			if (result.isRight()) {
				continue;
			}

			expect(
				result
					.getLeft()
					.some(
						error =>
							error.reason === 'rejected' &&
							error.path === 'declarations.0.input.moveId' &&
							error.message === message
					)
			).toBe(true);
			expect(resolver.calls).toHaveLength(0);
		}
	});

	it('does not resolve anything or consume randomness when a declaration is invalid', () => {
		const resolver = new StubResolver();
		const combatState = CombatTurnFixture.combat();
		const before = combatState.toPrimitives();
		const result = CombatTurnFixture.turnWith(resolver).resolve(combatState, [
			CombatTurnFixture.declaration(PLAYER, PLAYER_MOVE, OPPONENT),
		]);

		expect(result.isLeft()).toBe(true);
		expect(resolver.calls).toHaveLength(0);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('returns the engine failures instead of a partial resolution', () => {
		const resolver = new StubResolver({ rejectedMoveIds: [OPPONENT_MOVE] });
		const combatState = CombatTurnFixture.combat();
		const before = combatState.toPrimitives();
		const result = CombatTurnFixture.turnWith(resolver).resolve(combatState, CombatTurnFixture.declarations());

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('rejected');
		expect(combatState.toPrimitives()).toEqual(before);
	});

	it('does not change the input combat', () => {
		const combatState = CombatTurnFixture.combat();
		const before = combatState.toPrimitives();
		const result = CombatTurnFixture.turnWith(new StubResolver({ damage: { [PLAYER_MOVE]: 10 } })).resolve(
			combatState,
			CombatTurnFixture.declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(combatState.toPrimitives()).toEqual(before);
	});
});
