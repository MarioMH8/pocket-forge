# Domain entities

## Constructor is private

Entities have a **private constructor**. The only way to obtain an instance is through static factory methods. This guarantees every instantiation goes through a domain operation that can enforce invariants and record events.

## Two kinds of factory methods

| Kind                  | Purpose                                     | Records events? | Used by  |
|-----------------------|---------------------------------------------|-----------------|----------|
| **Domain operations** | Mutate state (create, update, delete, etc.) | Yes             | Commands |
| **Hydration**         | Rebuild from persisted data                 | No              | Queries  |

### Domain operations

Static methods that represent a business action. They:

1. Validate invariants.
2. Instantiate (or copy) the entity via the private constructor.
3. Record the corresponding domain event with `this.record(...)`.
4. Return the new instance.

An entity can have **as many domain operations as its business needs** — `create`, `delete`, `updateName`, `addMember`, `archive`, etc. There is no fixed set.

```typescript
// Example: two domain operations for an entity
class Entity {
  static create(primitives: Primitives<Entity>): Entity {
    const entity = new Entity(primitives);
    entity.record(new EntityCreatedEvent(entity.id.value));

    return entity;
  }

  static delete(entity: Entity): Entity {
    entity.record(new EntityDeletedEvent(entity.id.value));

    return entity;
  }
}
```

- Domain operations receive the same parameters as the constructor — scales better as props grow.
- The use case pulls events via `pullDomainEvents()` and publishes them through the `EventBus`.

### Hydration

A factory method that rebuilds an entity from primitives **without recording events**. Used by queries and repositories when loading persisted state.

```typescript
class Entity {
  static fromPrimitives(primitives: Primitives<Entity>): Entity {
    return new Entity(primitives);
  }
}
```

## Domain events

- One file per event class.
- Naming: `<EntityName>.<action>` (e.g., `Entity.created`, `Entity.deleted`).
- Extend `DomainEvent` from `@hexadrop/event`.

```typescript
export default class EntityCreatedEvent extends DomainEvent {
  static override EVENT_NAME = 'Entity.created';

  constructor(aggregateId: string) {
    super(EntityCreatedEvent.EVENT_NAME, aggregateId);
  }
}
```
