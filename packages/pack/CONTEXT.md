# Pack

The composition context: how a project selects Packs and turns them into a neutral game definition. It knows no gameplay subsystem and no dependency-injection container; each subsystem supplies the pure setup function that consumes the definition.

## Language

**Pack Manifest**:
The single declaration of a Pack, stored as `manifest.json`: identity, version, contributions, extensions, and content contracts.
_Avoid_: Pack config, pack.json

**Contribution**:
A `kind` plus a path that a Pack adds to the project. The subsystem that consumes the kind decides what the path contains.
_Avoid_: Section, entry, content block

**Content Contract**:
The versioned schema that a contribution's content satisfies for its kind. A Pack declares the contract each kind implements; the consuming subsystem declares which contracts it accepts.
_Avoid_: Global schema version, format version

**Content Index**:
The validated content of all selected Packs, merged by contribution kind, that every binding factory receives.
_Avoid_: Catalog registry, content store, resolved content

**Capability**:
A port that a binding can satisfy, expressed as an abstract class in the owning context.
_Avoid_: Token, service, interface

**Binding**:
A capability paired with a factory that creates its implementation from the Content Index.
_Avoid_: Provider, registration, service definition

**Game Definition**:
The resolved result of the selected Packs: the Content Index, merged bindings, extension declarations, diagnostics, and provenance.
_Avoid_: Game, container, resolved pack

**Provenance**:
The record of which Pack contributed each piece and which bindings were shadowed.
_Avoid_: Trace, log

**Shadowed Binding**:
A binding replaced by a later Pack's binding for the same capability, recorded in provenance instead of failing resolution.
_Avoid_: Override, conflict

**Override**:
A project-level `replace` or `remove` operation on a Pack contribution, declared in the project config and applied during resolution.
_Avoid_: Patch, merge, tweak

**Pack Extension**:
A compiled module that a Pack declares with its extension point, id, contract version, and module path.
_Avoid_: Plugin, addon
