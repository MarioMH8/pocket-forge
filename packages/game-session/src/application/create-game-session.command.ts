import Command from '@hexadrop/command';
import type { CommandHandler as CommandHandlerInterface } from '@hexadrop/command/bus';
import CommandHandler from '@hexadrop/command/decorator';
import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import type EventBus from '@hexadrop/event/bus';
import type { GameSessionRepository } from '@pocket-forge/game-session/domain';
import { GameSession } from '@pocket-forge/game-session/domain';

interface CreateGameSessionCommandConstructorParameters {
	id: string;
}

/**
 * Command to create a new {@link GameSession}.
 *
 * Carries the ULID string that will become the session's identity.
 *
 * @example
 * ```ts
 * const cmd = new CreateGameSessionCommand({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
 * ```
 */
class CreateGameSessionCommand extends Command {
	static override COMMAND_NAME = 'CreateGameSessionCommand';

	/**
	 *The ULID that will identify the new session.
	 */
	readonly id: string;

	constructor({ id }: CreateGameSessionCommandConstructorParameters) {
		super(CreateGameSessionCommand.COMMAND_NAME);
		this.id = id;
	}
}

/**
 * Handles {@link CreateGameSessionCommand} by creating a new session aggregate,
 * persisting it, and publishing the resulting domain events.
 *
 * @throws Never throws — errors are returned as left-side {@link Either} values.
 */
@CommandHandler(CreateGameSessionCommand)
class CreateGameSessionCommandHandler implements CommandHandlerInterface<CreateGameSessionCommand> {
	constructor(
		private readonly repository: GameSessionRepository,
		private readonly eventBus: EventBus
	) {}

	async run(command: CreateGameSessionCommand): Promise<Either<DomainError, void>> {
		const session = GameSession.create({ id: command.id });
		const result = await this.repository.upsert(session);

		if (result.isLeft()) {
			return result;
		}

		return this.eventBus.publish(...session.pullDomainEvents());
	}
}

export { CreateGameSessionCommand, CreateGameSessionCommandHandler };
