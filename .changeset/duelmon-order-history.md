---
---

Record the real action order in the Duelmon combat history. `DuelmonCombatTurn.resolve` now returns a `DuelmonCombatTurnResult` with the single `CombatResolution` plus the resolved actions in order, each carrying its actor, Move, target, and successor `Combat` snapshot. `DuelmonCombatHistory.recordTurn` appends one readable `action` entry per resolved action, reusing `DuelmonCombatReport`, while skipped or never-reached declarations are not recorded.
