import Command from '@hexadrop/command';
import type { CommandHandler as CommandHandlerInterface } from '@hexadrop/command/bus';
import CommandHandler from '@hexadrop/command/decorator';
import Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import type EventBus from '@hexadrop/event/bus';
import type { GameSessionRepository } from '@pocket-forge/game-session/domain';
import { GameSession, GameSessionId } from '@pocket-forge/game-session/domain';

interface DeleteGameSessionCommandConstructorParameters {
	id: string;
}

/**
 * Command to delete an existing {@link GameSession}.
 *
 * The handler looks up the session, marks it for deletion, removes it from
 * persistence, and publishes the {@link GameSessionDeletedEvent}.
 *
 * @example
 * ```ts
 * const cmd = new DeleteGameSessionCommand({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
 * ```
 */
class DeleteGameSessionCommand extends Command {
	static override COMMAND_NAME = 'DeleteGameSessionCommand';

	/**
	 *The ULID of the session to delete.
	 */
	readonly id: string;

	constructor({ id }: DeleteGameSessionCommandConstructorParameters) {
		super(DeleteGameSessionCommand.COMMAND_NAME);
		this.id = id;
	}
}

/**
 * Handles {@link DeleteGameSessionCommand} by looking up the session,
 * marking it deleted, removing it from the store, and publishing events.
 *
 * If the session is not found the repository error is propagated as-is.
 *
 * @throws Never throws — errors are returned as left-side {@link Either} values.
 */
@CommandHandler(DeleteGameSessionCommand)
class DeleteGameSessionCommandHandler implements CommandHandlerInterface<DeleteGameSessionCommand> {
	constructor(
		private readonly repository: GameSessionRepository,
		private readonly eventBus: EventBus
	) {}

	async run(command: DeleteGameSessionCommand): Promise<Either<DomainError, void>> {
		const id = new GameSessionId(command.id);
		const result = await this.repository.findById(id);

		if (result.isLeft()) {
			return Either.left(result.getLeft());
		}

		const session = GameSession.delete(result.getRight());
		const deletionResult = await this.repository.remove(id);

		if (deletionResult.isLeft()) {
			return deletionResult;
		}

		return this.eventBus.publish(...session.pullDomainEvents());
	}
}

export { DeleteGameSessionCommand, DeleteGameSessionCommandHandler };
