# Express Combat extension configuration through validated, typed attributes

> **Status:** accepted. This revision replaces the earlier flat-only attribute constraint recorded in this ADR; the superseded text remains available in git history.

Combat extensions need authored configuration for format rules, action bindings, and completion conditions. Rather than inventing a per-extension configuration format, extensions reuse the shared Attribute domain: `AttributeDefinition` declares the schema, including typed records with nested field definitions, and `AttributeMap` holds validated values. Rules, action resolvers, and action binding sets declare namespaced attributes such as `reference.*` and `completion.*` and may supply a cross-field validation hook for semantics that a single value cannot express. Attribute values may be scalars, arrays, typed records, or arrays of records; records are schema-driven and are never opaque JSON. We do not duplicate attribute validation inside each extension.

## Considered Options

- **Opaque serializable JSON configuration**: flexible but untyped, unvalidated at the boundary, and impossible to document or edit safely in a visual authoring tool.
- **JSON Schema per extension**: expressive and standard, but introduces a second schema system alongside the Attribute domain and produces validation errors that are disconnected from the rest of the model.
- **Hybrid of opaque JSON and flat attributes**: permits gradual adoption, but creates two sources of truth and ambiguous precedence.
- **Shared Attribute Definitions with typed records and optional cross-field hooks** (selected): one validation path, reusable definitions, recursive schemas for nested effects, and a hook for the few rules that span multiple fields.

## Consequences

- Attribute validation, defaults, constraints, and nested field validation are shared with the rest of the project instead of reimplemented per extension.
- Authored configuration is serializable and round-trips through `toPrimitives` / `fromPrimitives`, which supports persistence and authoring tools.
- Attribute values are recursive: scalars, arrays, typed records, and arrays of records. An `AttributeDefinition` of type `record` declares `fields`; arrays of records declare an `itemDefinition`.
- Structured semantics are expressed through nested, schema-driven records instead of opaque JSON or a second schema language.
- Namespacing (`reference.*`, `completion.*`) keeps extension keys from colliding as the catalog grows.
- Cross-field rules use an explicit validation hook, so multi-field semantics stay testable and are reported with the same failure style as field validation.
- **History:** the original ADR limited attribute values to flat scalars and simple arrays. This revision supersedes that constraint; it does not change the decision to reuse the Attribute domain for extension configuration.
