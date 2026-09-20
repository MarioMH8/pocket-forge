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
		files: ['**/*.md/**/*'],
		rules: {
			'import/no-unresolved': 'off',
		},
	},
	{
		files: ['packages/species/mother/domain/species.mother.ts'],
		rules: {
			'typescript/no-non-null-assertion': 'off',
		},
	}
);
