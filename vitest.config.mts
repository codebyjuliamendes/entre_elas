import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, test: { environment: 'node', fileParallelism: false, exclude: ['tests/e2e/**', 'node_modules/**'] } });
