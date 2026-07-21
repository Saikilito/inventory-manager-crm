import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'test-jwt-secret-do-not-use-in-production',
    },
    include: [
      'src/**/*.spec.ts',
      '../shared-domain/src/**/*.spec.ts',
    ],
  },
});
