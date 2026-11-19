import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'domain/index': 'src/domain/index.ts',
	},
});
