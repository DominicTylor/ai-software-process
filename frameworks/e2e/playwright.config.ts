import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

export default defineConfig({
  testDir: resolve(repoRoot, 'stories'),
  testMatch: ['**/e2e/**/*.spec.ts', '**/security/**/*.spec.ts', '**/a11y/**/*.spec.ts'],
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @canon/demo serve',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
