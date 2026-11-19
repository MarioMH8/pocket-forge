---
'@pocket-forge/ability': minor
'@pocket-forge/creature': minor
'@pocket-forge/move': minor
'@pocket-forge/species': minor
---

Remove `name` and `description` from catalog entities.

`Ability` and `Move` drop both `name` and `description`; `Species` and `Creature` drop `name`. The entities are identified by `id` and carry gameplay data in their validated attributes. The `create` factories, primitives, and Duelmon catalog mapping are updated accordingly.
