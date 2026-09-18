import UlidValueObject from '@hexadrop/value-object/ulid';

/**
 * Strongly-typed ULID value object that identifies a {@link GameSession}.
 *
 * Wraps a ULID string and enforces format validation inherited from
 * {@link UlidValueObject}. Use this instead of a raw string wherever
 * a session identity is required (repository lookups, event payloads, etc.).
 *
 * @throws {InvalidArgumentError} When the provided string is not a valid ULID.
 *
 * @example
 * ```ts
 * const id = new GameSessionId('01ARZ3NDEKTSV4RRFFQ69G5FAV');
 * console.log(id.value); // '01ARZ3NDEKTSV4RRFFQ69G5FAV'
 * ```
 */
export default class GameSessionId extends UlidValueObject {
	constructor(value: string) {
		super(value, 'GameSessionId');
	}
}
