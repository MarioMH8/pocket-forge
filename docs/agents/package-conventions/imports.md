# Imports

Cross-package imports use absolute `@pocket-forge/*` paths. Same-package imports use relative `./**` paths to avoid `import/no-cycle` errors.

```typescript
// ✅ Cross-package: absolute
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';

// ✅ Same-package: relative
import { AttributeAssignment } from './attribute-assignment';
import { AttributeDefinition } from '../../src/domain/attribute-definition';

// ❌ Wrong: relative across packages
// import { AttributeDefinition } from '../../attribute/src/domain/attribute-definition';

// ❌ Wrong: absolute within same package
// import { AttributeAssignment } from '@pocket-forge/attribute/domain';
```

## Import conventions for decorators and handlers

```typescript
// Decorator: no suffix

// Handler interface: prefixed with "Interface"
```
