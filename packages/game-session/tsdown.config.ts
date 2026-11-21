import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'application/index': 'src/application/index.ts',
		'domain/index': 'src/domain/index.ts',
	},
});
