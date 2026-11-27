---
---

Turn the file-local helpers of the Duelmon turn stack into static class methods without changing behaviour. `prefixPath` and `phaseOneShapeErrors` are now `private static` methods of `DuelmonTurnDeclarations`, and the tests group their local fixtures into explicit fixture classes. No assertion, expected value, test name, or test order changed.
