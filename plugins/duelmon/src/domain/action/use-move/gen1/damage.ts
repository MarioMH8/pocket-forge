/**
 * Input for the Gen 1 damage formula.
 */
interface Gen1DamageInput {
	/**
	 * Effort used by the move: Attack for Physical, Special for Special.
	 */
	readonly attack: number;
	/**
	 * Opposing stat: Defense for Physical, Special for Special.
	 */
	readonly defense: number;
	/**
	 * Attacker level.
	 */
	readonly level: number;
	/**
	 * Move base power.
	 */
	readonly power: number;
	/**
	 * Random factor in the Gen 1 217–255 range.
	 */
	readonly randomFactor: number;
	/**
	 * Whether the move matches one of the attacker's types.
	 */
	readonly stab: boolean;
	/**
	 * One multiplier per defending type, in order.
	 *
	 * The formula truncates after each multiplier, so this list cannot be
	 * replaced by its product.
	 */
	readonly typeMultipliers: readonly number[];
}

/**
 * Damage calculated with the Gen 1 integer truncation order.
 */
class Gen1Damage {
	/**
	 * Damage dealt, at least one for a non-immune hit.
	 */
	readonly amount: number;

	private constructor(amount: number) {
		this.amount = amount;
	}

	/**
	 * Calculates Gen 1 damage with the original integer truncation order.
	 *
	 * The order matches the original games: base damage, immunity, STAB, one
	 * truncation per defender type, then the random factor. The result is never
	 * lower than one for a non-immune hit.
	 *
	 * @param input - Damage inputs already resolved from combat and catalog state.
	 * @returns The calculated damage value.
	 * @example
	 * ```ts
	 * const damage = Gen1Damage.calculate({
	 * 	attack: 100,
	 * 	defense: 100,
	 * 	level: 50,
	 * 	power: 80,
	 * 	randomFactor: 255,
	 * 	stab: false,
	 * 	typeMultipliers: [1],
	 * });
	 *
	 * damage.amount; // 37
	 * ```
	 */
	static calculate({
		attack,
		defense,
		level,
		power,
		randomFactor,
		stab,
		typeMultipliers,
	}: Gen1DamageInput): Gen1Damage {
		if (typeMultipliers.includes(0)) {
			return new Gen1Damage(0);
		}

		const base = Math.floor(Math.floor((Math.floor((2 * level) / 5 + 2) * power * attack) / defense) / 50) + 2;
		let damage = stab ? Math.floor(base * 1.5) : base;

		for (const multiplier of typeMultipliers) {
			damage = Math.floor(damage * multiplier);
		}

		damage = Math.floor((damage * randomFactor) / 255);

		return new Gen1Damage(Math.max(1, damage));
	}
}

export type { Gen1DamageInput };
export { Gen1Damage };

export default Gen1Damage;
