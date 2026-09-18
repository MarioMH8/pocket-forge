# Imports

Cross-package imports use absolute `@pocket-forge/*` paths. Same-package and layer (`domain`, `application`, `infrastructure`, etc)
imports use relative `./**` paths.

```typescript
// ✅ Same folder: relative
import { AttributeAssignment } from '../attribute-assignment';
import { AttributeDefinition } from './attribute-definition';

// ✅ Different folder within same package: absolute
import { CreateGameSessionCommand } from '@pocket-forge/game-session/application';
import { GameSession } from '@pocket-forge/game-session/domain';

// ✅ Cross-package: absolute
import type { AttributeDefinition } from '@pocket-forge/attribute/domain';

// ✅ Mother/test files importing from src: absolute
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';

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
