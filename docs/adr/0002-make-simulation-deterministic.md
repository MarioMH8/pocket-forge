# Make simulation deterministic

Pocket Forge models Game Session state as immutable, serializable state advanced through validated Commands and recorded Domain Events. Random outcomes come from an explicit Seed and reproducible pseudo-random sequence, never ambient randomness. This choice makes saves, debugging, replay, tests, and later networked play reliable across rendering platforms.
