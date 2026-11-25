import InvalidArgumentError from '@hexadrop/error/invalid-argument';
import type { AttributeValue, AttributeValues } from '@pocket-forge/attribute/domain';
import type { DuelmonMoveCategory, DuelmonType } from '@pocket-forge/duelmon-dataset';
import { DuelmonTypes } from '@pocket-forge/duelmon-dataset';
import type { Move, MovePrimitives } from '@pocket-forge/move/domain';

import { DuelmonAttributeReader } from '../support/duelmon-attribute-reader';
import { DuelmonRecord } from '../support/duelmon-record';

/**
 * One stat-stage change declared by a Move.
 */
interface DuelmonBoost {
	/**
	 * Stage delta, from -6 to 6.
	 */
	readonly stages: number;
	/**
	 * Stat key as declared by the dataset.
	 */
	readonly stat: string;
}

/**
 * One Showdown flag declared by a Move.
 */
interface DuelmonFlag {
	/**
	 * Flag name.
	 */
	readonly name: string;
	/**
	 * Flag value.
	 */
	readonly value: number;
}

/**
 * Stat-stage changes applied to the user by a secondary effect.
 */
interface DuelmonSecondaryEffectSelf {
	/**
	 * Stat-stage changes applied to the user.
	 */
	readonly boosts?: readonly DuelmonBoost[];
}

/**
 * Probabilistic extra effect of a damaging Move.
 */
interface DuelmonSecondaryEffect {
	/**
	 * Stat-stage changes applied to the target.
	 */
	readonly boosts?: readonly DuelmonBoost[];
	/**
	 * Percentage chance, from 0 to 100.
	 */
	readonly chance?: number;
	/**
	 * Stat-stage changes applied to the user.
	 */
	readonly self?: DuelmonSecondaryEffectSelf;
	/**
	 * Primary status inflicted on the target.
	 */
	readonly status?: string;
	/**
	 * Volatile status inflicted on the target.
	 */
	readonly volatileStatus?: string;
}

/**
 * Semantic view of a neutral catalog Move.
 *
 * The view assumes the catalog validated the attributes. It hides the raw
 * attribute map behind typed getters and predicates and never replaces the
 * core Move as the source of truth.
 */
class DuelmonMove {
	/**
	 * Stable move identifier.
	 */
	readonly id: string;
	private cachedAttributes: DuelmonMoveAttributes | undefined;
	private readonly values: AttributeValues;

	private constructor(primitives: MovePrimitives) {
		this.id = primitives.id;
		this.values = primitives.attributes;
	}

	/**
	 * Accuracy percentage, from 1 to 100.
	 */
	get accuracy(): number {
		return this.attributes.accuracy;
	}

	/**
	 * Whether the Move skips the accuracy draw.
	 */
	get alwaysHits(): boolean {
		return this.attributes.alwaysHits;
	}

	/**
	 * Typed semantic attributes of the Move.
	 */
	get attributes(): DuelmonMoveAttributes {
		this.cachedAttributes ??= this.readAttributes();

		return this.cachedAttributes;
	}

	/**
	 * Stat-stage changes declared by the Move.
	 */
	get boosts(): readonly DuelmonBoost[] | undefined {
		return this.attributes.boosts;
	}

	/**
	 * Damage category that selects the offensive and defensive stats.
	 */
	get category(): DuelmonMoveCategory {
		return this.attributes.category;
	}

	/**
	 * Whether the Move changes stat stages.
	 */
	get changesStages(): boolean {
		return this.attributes.boosts !== undefined;
	}

	/**
	 * High critical-hit ratio, when greater than 1.
	 */
	get critRatio(): number | undefined {
		return this.attributes.critRatio;
	}

	/**
	 * Fraction of damage drained, as `[numerator, denominator]`.
	 */
	get drain(): readonly [number, number] | undefined {
		return this.attributes.drain;
	}

	/**
	 * Whether the Move drains damage.
	 */
	get drains(): boolean {
		return this.attributes.drain !== undefined;
	}

	/**
	 * Showdown flags declared by the Move.
	 */
	get flags(): readonly DuelmonFlag[] {
		return this.attributes.flags ?? [];
	}

	/**
	 * Whether the Move has a high critical-hit ratio.
	 */
	get hasHighCritRatio(): boolean {
		return (this.attributes.critRatio ?? 0) > 1;
	}

	/**
	 * Whether the Move applies a primary status.
	 */
	get hasPrimaryStatus(): boolean {
		return this.attributes.status !== undefined;
	}

	/**
	 * Whether the Move has a secondary effect.
	 */
	get hasSecondaryEffect(): boolean {
		return this.attributes.secondary !== undefined;
	}

	/**
	 * Whether the Move applies a volatile status.
	 */
	get hasVolatileStatus(): boolean {
		return this.attributes.volatileStatus !== undefined;
	}

	/**
	 * Whether the Move deals damage.
	 */
	get isDamaging(): boolean {
		return this.attributes.category !== 'Status';
	}

	/**
	 * Whether the Move hits multiple times.
	 */
	get isMultiHit(): boolean {
		return this.attributes.multihit !== undefined;
	}

	/**
	 * Whether the Move is a Status move.
	 */
	get isStatus(): boolean {
		return this.attributes.category === 'Status';
	}

	/**
	 * Number of hits as `[min, max]`.
	 */
	get multihit(): readonly [number, number] | undefined {
		return this.attributes.multihit;
	}

	/**
	 * Move base power.
	 */
	get power(): number {
		return this.attributes.power;
	}

	/**
	 * Base PP.
	 */
	get pp(): number {
		return this.attributes.pp;
	}

	/**
	 * Priority bracket.
	 */
	get priority(): number {
		return this.attributes.priority;
	}

	/**
	 * Fraction of damage recoiled, as `[numerator, denominator]`.
	 */
	get recoil(): readonly [number, number] | undefined {
		return this.attributes.recoil;
	}

	/**
	 * Whether the Move recoils damage.
	 */
	get recoils(): boolean {
		return this.attributes.recoil !== undefined;
	}

	/**
	 * Secondary effect declared by the Move.
	 */
	get secondary(): DuelmonSecondaryEffect | undefined {
		return this.attributes.secondary;
	}

	/**
	 * Primary status inflicted on the target.
	 */
	get status(): string | undefined {
		return this.attributes.status;
	}

	/**
	 * Move type.
	 */
	get type(): DuelmonType {
		return this.attributes.type;
	}

	/**
	 * Volatile status inflicted on the target.
	 */
	get volatileStatus(): string | undefined {
		return this.attributes.volatileStatus;
	}

	/**
	 * Builds a view from a neutral catalog Move.
	 *
	 * @param move - Validated neutral Move.
	 * @returns The semantic view.
	 */
	static fromMove(move: Move): DuelmonMove {
		return new DuelmonMove(move.toPrimitives());
	}

	/**
	 * Builds a view from a Move snapshot.
	 *
	 * @param primitives - Move primitives already validated at write time.
	 * @returns The semantic view.
	 */
	static fromPrimitives(primitives: MovePrimitives): DuelmonMove {
		return new DuelmonMove(primitives);
	}

	/**
	 * Whether the Move declares a Showdown flag.
	 *
	 * @param name - Flag name.
	 * @returns `true` when the flag is present.
	 */
	hasFlag(name: string): boolean {
		return this.flags.some(flag => flag.name === name);
	}

	/**
	 * Serializes the wrapped Move snapshot.
	 *
	 * @returns The Move primitives.
	 */
	toPrimitives(): MovePrimitives {
		return { attributes: { ...this.values }, id: this.id };
	}

	private invalid(key: string): InvalidArgumentError {
		return new InvalidArgumentError(`DuelmonMove "${this.id}" has an invalid "${key}" attribute`, 'DuelmonMove');
	}

	private readAttributes(): DuelmonMoveAttributes {
		const boosts = this.readBoosts(this.values['boosts']);
		const critRatio = DuelmonAttributeReader.optionalNumber(this.values, 'critRatio');
		const drain = this.readPair(this.values['drain'], 'drain');
		const flags = this.readFlags(this.values['flags']);
		const multihit = this.readPair(this.values['multihit'], 'multihit');
		const recoil = this.readPair(this.values['recoil'], 'recoil');
		const secondary = this.readSecondary(this.values['secondary']);
		const status = DuelmonAttributeReader.optionalString(this.values, 'status');
		const volatileStatus = DuelmonAttributeReader.optionalString(this.values, 'volatileStatus');

		return {
			accuracy: DuelmonAttributeReader.number(this.values, 'accuracy', `DuelmonMove "${this.id}"`),
			alwaysHits: DuelmonAttributeReader.boolean(this.values, 'alwaysHits', `DuelmonMove "${this.id}"`),
			category: this.readCategory(),
			power: DuelmonAttributeReader.number(this.values, 'power', `DuelmonMove "${this.id}"`),
			pp: DuelmonAttributeReader.number(this.values, 'pp', `DuelmonMove "${this.id}"`),
			priority: DuelmonAttributeReader.number(this.values, 'priority', `DuelmonMove "${this.id}"`),
			type: this.readType(),
			...(boosts !== undefined && { boosts }),
			...(critRatio !== undefined && { critRatio }),
			...(drain !== undefined && { drain }),
			...(flags !== undefined && { flags }),
			...(multihit !== undefined && { multihit }),
			...(recoil !== undefined && { recoil }),
			...(secondary !== undefined && { secondary }),
			...(status !== undefined && { status }),
			...(volatileStatus !== undefined && { volatileStatus }),
		};
	}

	private readBoosts(value: AttributeValue | undefined): readonly DuelmonBoost[] | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (!Array.isArray(value)) {
			throw this.invalid('boosts');
		}

		return value.map(item => {
			if (
				!DuelmonRecord.isRecord(item) ||
				typeof item['stat'] !== 'string' ||
				typeof item['stages'] !== 'number'
			) {
				throw this.invalid('boosts');
			}

			return { stages: item['stages'], stat: item['stat'] };
		});
	}

	private readCategory(): DuelmonMoveCategory {
		const value = this.values['category'];

		if (!DuelmonTypes.isCategory(value)) {
			throw this.invalid('category');
		}

		return value;
	}

	private readFlags(value: AttributeValue | undefined): readonly DuelmonFlag[] | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (!Array.isArray(value)) {
			throw this.invalid('flags');
		}

		return value.map(item => {
			if (
				!DuelmonRecord.isRecord(item) ||
				typeof item['name'] !== 'string' ||
				typeof item['value'] !== 'number'
			) {
				throw this.invalid('flags');
			}

			return { name: item['name'], value: item['value'] };
		});
	}

	private readPair(value: AttributeValue | undefined, key: string): readonly [number, number] | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (
			!Array.isArray(value) ||
			value.length !== 2 ||
			typeof value[0] !== 'number' ||
			typeof value[1] !== 'number'
		) {
			throw this.invalid(key);
		}

		return [value[0], value[1]];
	}

	private readSecondary(value: AttributeValue | undefined): DuelmonSecondaryEffect | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (!DuelmonRecord.isRecord(value)) {
			throw this.invalid('secondary');
		}

		const boosts = this.readBoosts(value['boosts']);
		const chance = typeof value['chance'] === 'number' ? value['chance'] : undefined;
		const selfEffect = this.readSecondarySelf(value['self']);
		const status = typeof value['status'] === 'string' ? value['status'] : undefined;
		const volatileStatus = typeof value['volatileStatus'] === 'string' ? value['volatileStatus'] : undefined;

		return {
			...(boosts !== undefined && { boosts }),
			...(chance !== undefined && { chance }),
			...(selfEffect !== undefined && { self: selfEffect }),
			...(status !== undefined && { status }),
			...(volatileStatus !== undefined && { volatileStatus }),
		};
	}

	private readSecondarySelf(value: AttributeValue | undefined): DuelmonSecondaryEffectSelf | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (!DuelmonRecord.isRecord(value)) {
			throw this.invalid('secondary.self');
		}

		const boosts = this.readBoosts(value['boosts']);

		return boosts === undefined ? {} : { boosts };
	}

	private readType(): DuelmonType {
		const value = this.values['type'];

		if (!DuelmonTypes.is(value)) {
			throw this.invalid('type');
		}

		return value;
	}
}

/**
 * Typed semantic attributes of a Move.
 */
interface DuelmonMoveAttributes {
	readonly accuracy: number;
	readonly alwaysHits: boolean;
	readonly boosts?: readonly DuelmonBoost[];
	readonly category: DuelmonMoveCategory;
	readonly critRatio?: number;
	readonly drain?: readonly [number, number];
	readonly flags?: readonly DuelmonFlag[];
	readonly multihit?: readonly [number, number];
	readonly power: number;
	readonly pp: number;
	readonly priority: number;
	readonly recoil?: readonly [number, number];
	readonly secondary?: DuelmonSecondaryEffect;
	readonly status?: string;
	readonly type: DuelmonType;
	readonly volatileStatus?: string;
}

export type { DuelmonBoost, DuelmonFlag, DuelmonMoveAttributes, DuelmonSecondaryEffect, DuelmonSecondaryEffectSelf };
export { DuelmonMove };

export default DuelmonMove;
