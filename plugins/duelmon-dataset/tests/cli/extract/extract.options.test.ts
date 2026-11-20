import path from 'node:path';

import { describe, expect, it } from 'bun:test';

import {
	DEFAULT_OUTPUT_PATH,
	DEFAULT_SHOWDOWN_COMMIT,
	extractOptionsSchema,
} from '../../../src/cli/extract/extract.options';

describe('extractOptionsSchema', () => {
	it('applies the pinned commit and default output when omitted', () => {
		const options = extractOptionsSchema.parse({ source: '/tmp/showdown' });

		expect(options).toEqual({
			commit: DEFAULT_SHOWDOWN_COMMIT,
			out: DEFAULT_OUTPUT_PATH,
			source: '/tmp/showdown',
		});
	});

	it('resolves source and output paths against the working directory', () => {
		const options = extractOptionsSchema.parse({ out: 'data/custom.json', source: './showdown' });

		expect(options.source).toBe(path.resolve('./showdown'));
		expect(options.out).toBe(path.resolve('data/custom.json'));
	});

	it('trims surrounding whitespace', () => {
		const options = extractOptionsSchema.parse({
			commit: ` ${DEFAULT_SHOWDOWN_COMMIT} `,
			source: ' /tmp/showdown ',
		});

		expect(options.commit).toBe(DEFAULT_SHOWDOWN_COMMIT);
		expect(options.source).toBe('/tmp/showdown');
	});

	it('rejects a missing source', () => {
		expect(extractOptionsSchema.safeParse({ source: ' '.repeat(3) }).success).toBe(false);
	});

	it('rejects an invalid commit', () => {
		const result = extractOptionsSchema.safeParse({ commit: 'main', source: '/tmp/showdown' });

		expect(result.success).toBe(false);
	});

	it('rejects an empty output path', () => {
		expect(extractOptionsSchema.safeParse({ out: '', source: '/tmp/showdown' }).success).toBe(false);
	});
});
