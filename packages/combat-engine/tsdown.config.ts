import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'domain/index': 'src/domain/index.ts',
		'rules/index': 'src/rules/index.ts',
	},
});
