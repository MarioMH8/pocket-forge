import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import GlossaryGenerator from './scripts/generate-glossary';
import TypedocGenerator from './scripts/generate-typedoc';

class DocumentationIntegration {
	static generate() {
		return {
			hooks: {
				'astro:build:start': () => {
					GlossaryGenerator.generate();
					TypedocGenerator.generate();
				},
				'astro:server:start': () => {
					GlossaryGenerator.generate();
					TypedocGenerator.generate();
				},
			},
			name: 'generate-documentation',
		};
	}
}

export default defineConfig({
	base: '/pocket-forge/',
	integrations: [
		DocumentationIntegration.generate(),
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
						{ autogenerate: { directory: 'api/combat-engine' } },
						{ autogenerate: { directory: 'api/duelmon' } },
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
