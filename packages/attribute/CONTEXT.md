# Attributes

Terms specific to the `@pocket-forge/attribute` package.

**Attribute Definition**:
A catalog-owned declaration that defines the key, type, default value, constraints, and nested field definitions for a reusable attribute.
_Avoid_: Property schema, field definition

**Attribute Map**:
An immutable, validated collection of attribute values keyed by Attribute Definition.
_Avoid_: Attribute assignment, property bag

**Attribute Value**:
A validated scalar, array of scalars, typed record, or array of Attribute Values. Records are schema-driven; opaque JSON is not an Attribute Value.
_Avoid_: JSON blob, arbitrary object

**Record Attribute**:
An Attribute Definition of type `record` whose `fields` declare its nested Attribute Definitions, enabling recursive validation and serialization.
_Avoid_: Nested JSON, free-form object
