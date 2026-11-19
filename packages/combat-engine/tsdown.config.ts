import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'domain/index': 'src/domain/index.ts',
		'rulesets/index': 'src/rulesets/index.ts',
	},
});
