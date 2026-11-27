# Testing

## Test runner

Tests run with Bun. Always use `--conditions=development` so the `"development"` export condition resolves to source files:

```bash
bun test --conditions=development
```

## Object Mother pattern

Every entity and use-case params has a Mother class in `mother/<layer>/`. Mothers use `@faker-js/faker` for random data and accept optional overrides.

```typescript
// mother/domain/entity.mother.ts
export default class EntityMother {
  static create(overrides?: { id?: string }): Entity {
    return Entity.create({ id: overrides?.id ?? faker.string.ulid() });
  }

  static fromPrimitives(overrides?: { id?: string }): Entity {
    return Entity.fromPrimitives({ id: overrides?.id ?? faker.string.ulid() });
  }
}
```

## Mock implementations

Mocks live in `mock/<layer>/` and use `vi.fn()` from `bun:test`. They extend the abstract repository class.

```typescript
// mock/domain/entity.repository.ts
export default class MockEntityRepository extends EntityRepository {
  findById = vi.fn<(id: EntityId) => Promise<Either<DomainError, Entity>>>();
  remove = vi.fn<(id: EntityId) => Promise<Either<DomainError, void>>>();
  upsert = vi.fn<(entity: Entity) => Promise<Either<DomainError, void>>>();
}
```

## Test structure

- **Domain tests**: no mocks — test entities, value objects, and events directly.
- **Application tests**: use mock repositories and `BunMockEventBus` from `@hexadrop/event/bus/mock/bun`.

```typescript
describe('CreateEntityCommandHandler', () => {
  it('persists the entity and publishes created event', async () => {
    const repository = new MockEntityRepository();
    repository.upsert.mockResolvedValue(Either.right());
    const eventBus = new BunMockEventBus();
    const handler = new CreateEntityCommandHandler(repository, eventBus);
    const command = CreateEntityCommandMother.create();

    const result = await handler.run(command);

    expect(result.isRight()).toBe(true);
    eventBus.assertPublishedEvents(new EntityCreatedEvent(command.id));
  });
});
```
