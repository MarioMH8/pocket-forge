import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import generateGlossary from './scripts/generate-glossary';
import generateTypedoc from './scripts/generate-typedoc';

function generateDocumentation() {
	return {
		hooks: {
			'astro:build:start': () => {
				generateGlossary();
				generateTypedoc();
			},
			'astro:server:start': () => {
				generateGlossary();
				generateTypedoc();
			},
		},
		name: 'generate-documentation',
	};
}

export default defineConfig({
	base: '/pocket-forge/',
	integrations: [
		generateDocumentation(),
		starlight({
			customCss: ['./src/styles/custom.css'],
			description: 'Build your own RPG from map to battle to replay.',
			logo: {
				replacesTitle: true,
				src: './src/assets/logo.svg',
			},
			sidebar: [
				{
					items: [
						{ label: 'Getting Started', slug: 'guides/getting-started' },
						{ label: 'Glossary', slug: 'guides/glossary' },
					],
					label: 'Guides',
				},
				{
					items: [
						{ autogenerate: { directory: 'api/ability' } },
						{ autogenerate: { directory: 'api/attribute' } },
						{ autogenerate: { directory: 'api/combat' } },
						{ autogenerate: { directory: 'api/combat-reference' } },
						{ autogenerate: { directory: 'api/creature' } },
						{ autogenerate: { directory: 'api/game-session' } },
						{ autogenerate: { directory: 'api/move' } },
						{ autogenerate: { directory: 'api/rng' } },
						{ autogenerate: { directory: 'api/species' } },
					],
					label: 'API Reference',
				},
			],
			social: [{ href: 'https://github.com/MarioMH8/pocket-forge', icon: 'github', label: 'GitHub' }],
			title: 'Pocket Forge',
		}),
	],
	site: 'https://mariomh8.github.io/pocket-forge/',
});
