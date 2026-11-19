import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: ['src/domain/index.ts', 'src/infrastructure/index.ts', 'src/rulesets/index.ts'],
});
