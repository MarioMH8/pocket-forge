import Either from '@hexadrop/either';
import type { Combat, CombatPrimitives } from '@pocket-forge/combat/domain';
import { Combat as CombatEntity } from '@pocket-forge/combat/domain';
import type {
	CombatActionContext,
	CombatActionResolver,
	CombatEngine,
	CombatResolutionError,
	CombatTransition,
} from '@pocket-forge/combat-engine/domain';
import {
	CombatEngine as CombatEngineEntity,
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

/**
 * Resolver stub that records every call and applies a fixed HP reduction.
 *
 * It isolates the turn service from the real Move mechanics: the service owns
 * ordering, event merging, and state threading, while the stub makes the calls
 * and their combat snapshots observable.
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
				combatants: group.combatants.map(combatant =>
					combatant.id === targetId
						? {
								...combatant,
								attributes: {
									...combatant.attributes,
									hp: Math.max(0, Number(combatant.attributes['hp']) - damage),
								},
							}
						: combatant
				),
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

function combat(overrides: CombatOverrides = {}): Combat {
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

function declaration(actorId: string, moveId: string, targetId: string) {
	return {
		actorId,
		moveId,
		target: { id: targetId, scope: 'combatant' as const },
	};
}

function declarations() {
	return [declaration(PLAYER, PLAYER_MOVE, OPPONENT), declaration(OPPONENT, OPPONENT_MOVE, PLAYER)];
}

function engineWith(resolver: StubResolver, moveIds: readonly string[] = [PLAYER_MOVE, OPPONENT_MOVE]): CombatEngine {
	const actionBindings = DuelmonCombatMother.useMoveBindings(moveIds);

	return new CombatEngineEntity(
		CombatSetup.create({
			actionBindings,
			actions: resolver,
			rules: [],
		})
	);
}

function turnWith(
	resolver: StubResolver,
	moveIds: readonly string[] = [PLAYER_MOVE, OPPONENT_MOVE]
): DuelmonCombatTurn {
	return new DuelmonCombatTurn(CATALOG, engineWith(resolver, moveIds));
}

function activeCombatant(combatState: Combat, id: string): DuelmonCombatant {
	const found = DuelmonCombat.fromCombat(combatState)
		.groups()
		.flatMap(group => group.combatants())
		.find(combatant => combatant.id === id);

	if (!found) {
		throw new Error(`Missing combatant "${id}"`);
	}

	return found;
}

function moveUsedPairs(events: readonly { payload: Record<string, unknown>; type: string }[]): readonly string[] {
	return events
		.filter(event => event.type === 'move-used')
		.map(event => `${String(event.payload['attackerId'])}:${String(event.payload['moveId'])}`);
}

describe('DuelmonCombatTurn', () => {
	it('resolves the fastest declared actor first and the slower one afterwards', () => {
		const resolver = new StubResolver({ damage: { [OPPONENT_MOVE]: 5, [PLAYER_MOVE]: 10 } });
		const result = turnWith(resolver).resolve(combat(), declarations());

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.actorId)).toEqual([PLAYER, OPPONENT]);
	});

	it('threads the successor combat of each action into the next action', () => {
		const resolver = new StubResolver({ damage: { [OPPONENT_MOVE]: 5, [PLAYER_MOVE]: 10 } });
		const result = turnWith(resolver).resolve(combat(), declarations());

		expect(result.isRight()).toBe(true);

		const secondCall = resolver.calls[1];

		expect(secondCall).toBeDefined();

		if (!secondCall) {
			return;
		}

		expect(activeCombatant(secondCall.combat, OPPONENT).hp).toBe(94);
		expect(activeCombatant(secondCall.combat, PLAYER).hp).toBe(99);

		const resolution = result.getRight();

		expect(activeCombatant(resolution.combat, OPPONENT).hp).toBe(94);
		expect(activeCombatant(resolution.combat, PLAYER).hp).toBe(94);
	});

	it('skips an actor that is no longer standing when its action comes up', () => {
		const resolver = new StubResolver({ damage: { [PLAYER_MOVE]: 10 } });
		const result = turnWith(resolver).resolve(combat({ opponentHp: 5 }), declarations());

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.actorId)).toEqual([PLAYER]);

		const resolution = result.getRight();

		expect(activeCombatant(resolution.combat, OPPONENT).isFainted).toBe(true);
		expect(resolution.events.map(event => event.sequence)).toEqual([1, 2]);
	});

	it('resolves exactly the Move declared by each side and no other action', () => {
		const resolver = new StubResolver();
		const result = turnWith(resolver, [PLAYER_MOVE, OPPONENT_MOVE, 'tackle']).resolve(combat(), declarations());

		expect(result.isRight()).toBe(true);
		expect(resolver.calls.map(call => call.moveId)).toEqual([PLAYER_MOVE, OPPONENT_MOVE]);
		expect(moveUsedPairs(result.getRight().events)).toEqual([
			`${PLAYER}:${PLAYER_MOVE}`,
			`${OPPONENT}:${OPPONENT_MOVE}`,
		]);
	});

	it('merges and renumbers the events of every action continuously', () => {
		const resolver = new StubResolver();
		const result = turnWith(resolver).resolve(combat(), declarations());

		expect(result.isRight()).toBe(true);
		expect(result.getRight().events.map(event => event.sequence)).toEqual([1, 2, 3, 4]);
	});

	it('breaks equal speeds by the fixed combat order', () => {
		const first = new StubResolver();
		const firstResult = turnWith(first).resolve(combat({ opponentSpeed: 70 }), declarations());

		expect(firstResult.isRight()).toBe(true);
		expect(first.calls.map(call => call.actorId)).toEqual([PLAYER, OPPONENT]);

		const reversed = new StubResolver();
		const reversedResult = turnWith(reversed).resolve(
			combat({ opponentSpeed: 70, playerFirst: false }),
			declarations()
		);

		expect(reversedResult.isRight()).toBe(true);
		expect(reversed.calls.map(call => call.actorId)).toEqual([OPPONENT, PLAYER]);
	});

	it('does not resolve anything or consume randomness when a declaration is invalid', () => {
		const resolver = new StubResolver();
		const combatState = combat();
		const before = combatState.toPrimitives();
		const result = turnWith(resolver).resolve(combatState, [declaration(PLAYER, PLAYER_MOVE, OPPONENT)]);

		expect(result.isLeft()).toBe(true);
		expect(resolver.calls).toHaveLength(0);
		expect(combatState.toPrimitives()).toEqual(before);
		expect(combatState.randomPocket.toPrimitives()).toEqual({ seed: 42, state: 42 });
	});

	it('returns the engine failures instead of a partial resolution', () => {
		const resolver = new StubResolver({ rejectedMoveIds: [OPPONENT_MOVE] });
		const combatState = combat();
		const before = combatState.toPrimitives();
		const result = turnWith(resolver).resolve(combatState, declarations());

		expect(result.isLeft()).toBe(true);

		if (result.isRight()) {
			return;
		}

		expect(result.getLeft()[0]?.reason).toBe('rejected');
		expect(combatState.toPrimitives()).toEqual(before);
	});

	it('does not change the input combat', () => {
		const combatState = combat();
		const before = combatState.toPrimitives();
		const result = turnWith(new StubResolver({ damage: { [PLAYER_MOVE]: 10 } })).resolve(
			combatState,
			declarations()
		);

		expect(result.isRight()).toBe(true);
		expect(combatState.toPrimitives()).toEqual(before);
	});
});
