---
'@pocket-forge/combat-engine': minor
---

Make Combat events a typed, discoverable catalog.

`CombatEvent` is now generic over its type and payload. The engine exports `COMBAT_EVENT_TYPES`, `CombatEventMap`, `CombatEventType`, `CoreCombatEvent`, `KnownCombatEvent`, and the `CombatEvents.completed` factory. Plugins register their own events by augmenting `CombatEventMap`, so `KnownCombatEvent` is a discriminated union of every event known to the program.

**Breaking for 0.x consumers:** use `CombatEvents.completed` (or a plugin event builder) instead of a hardcoded `type` string, and use `KnownCombatEvent` for exhaustive handling.
