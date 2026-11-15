import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';

export const collections = {
	// eslint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
