import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/email/**', 'src/modules/prospects/**'],
    },
    // Don't require actual Redis/Supabase for unit tests
    env: {
      NODE_ENV: 'test',
    },
  },
});
