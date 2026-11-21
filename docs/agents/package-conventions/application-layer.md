# Application layer

## Commands

- Extend `Command` from `@hexadrop/command`.
- Handler implements `CommandHandler` interface from `@hexadrop/command/bus` (imported as `CommandHandlerInterface`).
- Decorated with `@CommandHandler(CommandClass)` from `@hexadrop/command/decorator`.
- The handler injects `EventBus` and publishes domain events after persistence.

```typescript
import Command from '@hexadrop/command';
import type { CommandHandler as CommandHandlerInterface } from '@hexadrop/command/bus';
import CommandHandler from '@hexadrop/command/decorator';

class CreateEntityCommand extends Command {
  static override COMMAND_NAME = 'CreateEntityCommand';
  readonly id: string;
  constructor({ id }: { id: string }) {
    super(CreateEntityCommand.COMMAND_NAME);
    this.id = id;
  }
}

@CommandHandler(CreateEntityCommand)
class CreateEntityCommandHandler implements CommandHandlerInterface<CreateEntityCommand> {
  constructor(
    private readonly repository: EntityRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: CreateEntityCommand): Promise<Either<DomainError, void>> {
    const entity = Entity.create({ id: command.id });
    const result = await this.repository.upsert(entity);
    if (result.isLeft()) {
      return result;
    }

    return this.eventBus.publish(...entity.pullDomainEvents());
  }
}
```

## Queries

- Extend `Query<ResponseType>` from `@hexadrop/query`.
- Handler implements `QueryHandler` interface from `@hexadrop/query/bus` (imported as `QueryHandlerInterface`).
- Decorated with `@QueryHandler(QueryClass)` from `@hexadrop/query/decorator`.
- Queries use `fromPrimitives` to hydrate entities — no events are recorded.
