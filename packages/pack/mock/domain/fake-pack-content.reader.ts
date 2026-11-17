import Either from '@hexadrop/either';
import type { Contribution, PackError } from '@pocket-forge/pack/domain';
import { PackContentReader, PackError as PackContentError } from '@pocket-forge/pack/domain';
import { vi } from 'bun:test';

function key(root: string, path: string): string {
	return `${root}/${path}`;
}

export default class FakePackContentReader extends PackContentReader {
	read = vi.fn((root: string, contribution: Contribution): Promise<Either<PackError[], unknown>> => {
		const stored = this.contents.get(key(root, contribution.path));

		if (stored) {
			return Promise.resolve(stored);
		}

		return Promise.resolve(
			Either.left([
				new PackContentError('content-read-failed', `Cannot read '${contribution.path}'`, contribution.path),
			])
		);
	});

	private readonly contents = new Map<string, Either<PackError[], unknown>>();

	constructor(contents: Readonly<Record<string, unknown>> = {}) {
		super();

		for (const [path, value] of Object.entries(contents)) {
			this.contents.set(path, Either.right(value));
		}
	}

	fail(root: string, path: string, message = `Cannot read '${path}'`): void {
		this.contents.set(key(root, path), Either.left([new PackContentError('content-read-failed', message, path)]));
	}
}
