# RNG

Terms specific to the `@pocket-forge/rng` package.

**RandomPocket**:
A seedable, deterministic pseudo-random number generator that wraps mulberry32. Every mutation returns a new instance, keeping the entity immutable. It is the single source of randomness for all game systems — battles, encounters, loot, and procedural generation.
_Avoid_: RNG, randomizer, dice roller
