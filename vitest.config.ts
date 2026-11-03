import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['packages/**/*.test.{ts,tsx}', 'apps/web/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['packages/core/src/**', 'apps/web/src/services/**', 'packages/ui/src/**'],
      exclude: ['**/*.test.*'],
    },
  },
});
