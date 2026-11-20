import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		index: 'src/dataset/index.ts',
	},
});
