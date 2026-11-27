import hexadrop from '@hexadrop/eslint-config';

export default hexadrop(
	{
		rules: {
			'import/no-unresolved': [
				'error',
				{
					ignore: ['@pocket-forge/*', 'bun:test', 'astro:content'],
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
		typescript: ['tsconfig.json', 'apps/docs/tsconfig.json'],
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
	},
	{
		files: ['packages/combat/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@pocket-forge/combat-engine', '@pocket-forge/combat-engine/*'],
							message:
								'Combat state cannot depend on the Combat Engine. The engine depends on combat, never the reverse.',
						},
						{
							group: ['@pocket-forge/duelmon', '@pocket-forge/duelmon/*'],
							message:
								'The neutral Combat core cannot depend on Duelmon implementations. Move this logic into plugins/duelmon.',
						},
					],
				},
			],
		},
	},
	{
		files: ['packages/combat-engine/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@pocket-forge/duelmon', '@pocket-forge/duelmon/*'],
							message:
								'The neutral Combat Engine cannot depend on Duelmon implementations. Move this logic into plugins/duelmon.',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/docs/src/content.config.ts'],
		rules: {
			'import/prefer-default-export': 'off',
		},
	},
	{
		files: ['apps/docs/scripts/*'],
		rules: {
			'no-cond-assign': 'off',
			'no-console': 'off',
		},
	}
);
