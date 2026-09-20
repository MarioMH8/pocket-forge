# Imports

Cross-package imports use absolute `@pocket-forge/*` paths. Same-package and layer (`domain`, `application`, `infrastructure`, etc)
imports use relative `./**` paths.

```typescript
// ✅ Same folder: relative

// ✅ Different folder within same package: absolute

// ✅ Cross-package: absolute

// ✅ Infrastructure imports: absolute

// ✅ Mother/test files importing from src: absolute

// ❌ Wrong: relative across folders within same package
// import GameSession from '../../src/domain/game-session';

// ❌ Wrong: relative across packages
// import { AttributeDefinition } from '../../attribute/src/domain/attribute-definition';

// ❌ Wrong: absolute within same folder
// import { AttributeAssignment } from '@pocket-forge/attribute/domain';
```

## Import conventions for decorators and handlers

```typescript
// Decorator: no suffix

// Handler interface: prefixed with "Interface"
```
