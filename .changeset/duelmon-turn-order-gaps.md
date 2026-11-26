---
---

Record the turn order in the history and enforce the Phase 1 move-support policy at the turn boundary. `DuelmonCombatTurnAction` and action history entries now expose the actor `speed` and `tieBreak`, and the readable entry text explains the order with both Speeds or the fixed tie. `DuelmonTurnDeclarations.receive` rejects Status, non-zero priority, and other unsupported Moves with a structured `rejected` failure on `input.moveId`, while the generic declaration validation and plugin keep their own contracts.
