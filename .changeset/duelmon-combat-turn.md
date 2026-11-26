---
---

Resolve a Phase 1 turn with `DuelmonCombatTurn`: receive the two validated declarations, order them by Speed, resolve each declared action sequentially through the Combat Engine against the successor state, skip an actor without positive hit points, and return one `CombatResolution` with the merged events renumbered in turn order.
