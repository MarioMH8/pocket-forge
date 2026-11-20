---
'@pocket-forge/combat-engine': minor
---

Turn `CombatOutcome` into a domain entity hierarchy.

`CombatOutcome` now exposes `CombatOutcome.draw()` and `CombatOutcome.victory(winnerGroupId)` factories plus `isDraw()` and `isVictory()` type guards. Outcomes are immutable class instances instead of plain object literals.

**Breaking for 0.x consumers:** replace `{ status: 'draw' }` and `{ status: 'victory', winnerGroupId }` literals with the factories, and use `isVictory()` when accessing `winnerGroupId`.
