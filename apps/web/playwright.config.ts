import { defineConfig, devices } from '@playwright/test';

const e2ePort = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // A primeira navegação para uma rota protegida inclui a compilação sob
  // demanda do `next dev`, que passa de 20s com o cache frio.
  timeout: 120_000,
  expect: { timeout: 45_000 },
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: 'on-first-retry',
    navigationTimeout: 45_000,
  },
  webServer: {
    command: `pnpm exec next dev --port ${e2ePort}`,
    url: `http://127.0.0.1:${e2ePort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_CLOCK_NOW: '2026-09-03T15:00:00.000Z',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
