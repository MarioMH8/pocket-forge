import Command from '@hexadrop/command';
import type { CommandHandler as CommandHandlerInterface } from '@hexadrop/command/bus';
import CommandHandler from '@hexadrop/command/decorator';
import type Either from '@hexadrop/either';
import type DomainError from '@hexadrop/error';
import type EventBus from '@hexadrop/event/bus';

import GameSession from '../domain/game-session';
import type GameSessionRepository from '../domain/repository';

interface CreateGameSessionCommandConstructorParameters {
	id: string;
}

class CreateGameSessionCommand extends Command {
	static override COMMAND_NAME = 'CreateGameSessionCommand';

	readonly id: string;

	constructor({ id }: CreateGameSessionCommandConstructorParameters) {
		super(CreateGameSessionCommand.COMMAND_NAME);
		this.id = id;
	}
}

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
