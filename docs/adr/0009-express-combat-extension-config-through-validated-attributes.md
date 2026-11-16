# Express combat extension configuration through validated attributes

Combat extensions need authored configuration for format rules, action bindings, and completion conditions. Rather than inventing a per-extension configuration format, extensions reuse the shared Attribute domain: `AttributeDefinition` declares the schema, and `AttributeMap` holds validated values. Rulesets, action plugins, and completion rules declare namespaced attributes such as `reference.*` and `completion.*` and may supply a cross-field validation hook for semantics that a single value cannot express. We do not store opaque JSON configuration, and we do not duplicate attribute validation inside each extension.

## Considered Options

- **Opaque serializable JSON configuration**: flexible but untyped, unvalidated at the boundary, and impossible to document or edit safely in a visual authoring tool.
- **JSON Schema per extension**: expressive and standard, but introduces a second schema system alongside the Attribute domain and produces validation errors that are disconnected from the rest of the model.
- **Hybrid of opaque JSON and attributes**: permits gradual adoption, but creates two sources of truth and ambiguous precedence.
- **Shared Attribute Definitions and validated Attribute Maps, with optional cross-field hooks** (selected): one validation path, reusable definitions, and a hook for the few rules that span multiple fields.

## Consequences

- Attribute validation, defaults, and constraints are shared with the rest of the project instead of reimplemented per extension.
- Authored configuration is serializable and round-trips through `toPrimitives` / `fromPrimitives`, which supports persistence and authoring tools.
- Attribute values remain flat and scalar; structured semantics are expressed through namespaced keys rather than nested objects.
- Namespacing (`reference.*`, `completion.*`) keeps extension keys from colliding as the catalog grows.
- Cross-field rules use an explicit validation hook, so multi-field semantics stay testable and are reported with the same failure style as field validation.
