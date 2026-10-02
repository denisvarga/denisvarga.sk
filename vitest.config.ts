import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vite.base.ts';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'app',
            environment: 'jsdom',
            include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'node',
            environment: 'node',
            include: ['worker/**/*.test.ts', 'scripts/**/*.test.ts'],
          },
        },
      ],
    },
  }),
);
