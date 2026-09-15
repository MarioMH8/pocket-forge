# Repository abstractions

Repositories are **abstract classes** (not interfaces) in `src/domain/repository/`. They define the persistence contract for an aggregate root.

## Return types

All methods return `Either<DomainError, T>`:

| Kind      | Return type                 | Example                  |
|-----------|-----------------------------|--------------------------|
| **Read**  | `Either<DomainError, T>`    | Find by id, search, list |
| **Write** | `Either<DomainError, void>` | Save, delete, upsert     |

## Method design

A repository exposes **as many methods as the use cases need** — there is no fixed set. Common examples:

```typescript
export default abstract class EntityRepository {
  abstract findById(id: EntityId): Promise<Either<DomainError, Entity>>;
  abstract remove(id: EntityId): Promise<Either<DomainError, void>>;
  abstract upsert(entity: Entity): Promise<Either<DomainError, void>>;
}
```

- Each method is `abstract` — the implementation lives in `infrastructure/`.
- The repository is the **only** contract the domain exposes to the outside world for persistence.
- Query methods return the entity (or `null`/`NotFoundError`), write methods return `void` on success.
