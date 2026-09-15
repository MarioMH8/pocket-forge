import UlidValueObject from '@hexadrop/value-object/ulid';

export default class GameSessionId extends UlidValueObject {
	constructor(value: string) {
		super(value, 'GameSessionId');
	}
}
