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

class DeleteGameSessionCommand extends Command {
	static override COMMAND_NAME = 'DeleteGameSessionCommand';

	readonly id: string;

	constructor({ id }: DeleteGameSessionCommandConstructorParameters) {
		super(DeleteGameSessionCommand.COMMAND_NAME);
		this.id = id;
	}
}

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
