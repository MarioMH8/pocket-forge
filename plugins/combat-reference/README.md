<h1 align="center">
  @pocket-forge/combat-reference
</h1>

<p align="center">
  Reference Combat action plugin and authored action set for Pocket Forge.
</p>

This package is a reference implementation. It lives outside the neutral Combat
core and proves that Move logic and authored bindings compose through public
extension contracts instead of importing implementation details.

- `ReferenceCombatPlugin` resolves the `modifyAttribute` action.
- `ReferenceCombatActionSet` validates authored Move-to-action bindings against
  the plugin catalog and a contract version range.
