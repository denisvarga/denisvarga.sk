import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:4173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
