---
---

Stop a Phase 1 turn after the action that completes the combat: `DuelmonCombatTurn` rejects a turn over a non-active combat with `CombatEngineError('combat-not-active')`, stops immediately when the engine completes the battle, keeps the exact outcome and `winnerGroupId`, and never resolves, emits events for, or consumes PP or randomness for the omitted declaration.
