<h1 align="center">
  @pocket-forge/combat-reference
</h1>

<p align="center">
  Reference Combat formats, action plugin, and authored action set for Pocket Forge.
</p>

This package is a reference implementation. It lives outside the neutral Combat
core and proves that combat formats, Move logic, and authored bindings compose
through public extension contracts instead of importing implementation details.

- `OneVersusOneCombatRuleset` and `TwoVersusTwoCombatRuleset` declare reusable
  combat formats.
- `ReferenceCombatRulesetFactory` hydrates them by `kind` with version and
  constraint checks.
- `ReferenceCombatPlugin` resolves the `modifyAttribute` action.
- `ReferenceCombatActionSet` validates authored Move-to-action bindings.
- `ReferenceCombatCompletionRuleFactory` hydrates completion rules by `kind`,
  and `ThresholdCombatCompletionRule` ends combat when a Combatant attribute
  crosses an authored `completion.*` threshold.
