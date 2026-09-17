import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: ['src/domain/index.ts'],
});
