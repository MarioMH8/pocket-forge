import hexadrop from '@hexadrop/eslint-config';

export default hexadrop(
	{
		rules: {
			'import/no-unresolved': [
				'error',
				{
					ignore: ['@pocket-forge/*', 'bun:test'],
				},
			],
			'unicorn/name-replacements': [
				'error',
				{
					allowList: {
						application: true,
						Application: true,
						env: true,
						Environment: true,
						props: true,
						Props: true,
						repository: true,
						Repository: true,
					},
				},
			],
		},
	},
	{
		files: ['**/mock/**/index.ts', '**/mother/**/index.ts'],
		rules: {
			'import/prefer-default-export': 'off',
		},
	},
	{
		files: ['**/*.md/**/*', '**/*.md'],
		rules: {
			'import-sort/imports': 'off',
			'import-unused/no-unused-imports': 'off',
			'import/no-duplicates': 'off',
			'import/no-unresolved': 'off',
		},
	}
);
